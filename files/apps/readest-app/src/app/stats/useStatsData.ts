'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEnv } from '@/components/paperback/platform';
import { useLibrary } from '@/components/paperback/platform';
import { useLibraryStore } from '@/components/paperback/platform';
import { StatisticsDb } from '@/components/paperback/platform';
import { rangeStart, type StatEventRow, type StatsRange } from '@/services/statistics/statsAggregate';
import type { Book } from '@/components/paperback/platform';

/** Loads every page-read event once (a few thousand rows at most) plus the library. */
export function useStatsData() {
  const { appService } = useEnv();
  const { libraryLoaded } = useLibrary();
  const library = useLibraryStore((s) => s.library);
  const [events, setEvents] = useState<StatEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appService) return;
    let cancelled = false;
    (async () => {
      try {
        const db = await StatisticsDb.open(appService);
        const rows = await db.getPageEventsSince(0);
        if (!cancelled) setEvents(rows);
      } catch (e) {
        console.warn('[paperback] could not load reading stats:', e);
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appService]);

  const now = useMemo(() => new Date(), []);
  const booksByHash = useMemo(() => {
    const map = new Map<string, Book>();
    for (const b of library) if (!b.deletedAt) map.set(b.hash, b);
    return map;
  }, [library]);

  return { events, error, now, library, libraryLoaded, booksByHash };
}

type FinishedLike = Pick<Book, 'deletedAt' | 'readingStatus' | 'readingStatusUpdatedAt' | 'updatedAt'>;

/** Books marked finished whose status changed at/after `since` (ms). */
export function countFinishedSince(library: FinishedLike[], since: Date): number {
  const from = since.getTime();
  return library.filter(
    (b) =>
      !b.deletedAt &&
      b.readingStatus === 'finished' &&
      (b.readingStatusUpdatedAt ?? b.updatedAt ?? 0) >= from,
  ).length;
}

export const countFinishedInRange = (library: FinishedLike[], range: StatsRange, now: Date) =>
  countFinishedSince(library, rangeStart(range, now));

export const countFinishedThisYear = (library: FinishedLike[], now: Date) =>
  countFinishedSince(library, new Date(now.getFullYear(), 0, 1));
