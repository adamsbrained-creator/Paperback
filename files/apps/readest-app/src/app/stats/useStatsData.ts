'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEnv, useLibrary, useLibraryStore, StatisticsDb } from '@/components/paperback/platform';
import { useCatalog } from '@/components/paperback/useCatalog';
import type { PBook } from '@/services/paperback/library';
import { rangeStart, type StatEventRow, type StatsRange } from '@/services/statistics/statsAggregate';

/**
 * Loads every page-read event once (a few thousand rows at most) and Paperback's own book list
 * (see useCatalog: shown from Paperback's saved copy, refreshed from Readest's library).
 */
export function useStatsData() {
  const { appService } = useEnv();
  const { libraryLoaded: readestLoaded } = useLibrary();
  const readestLibrary = useLibraryStore((s) => s.library);
  const catalog = useCatalog(readestLibrary, readestLoaded);
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
  const library: PBook[] = catalog.books;

  return { events, error, now, library, libraryLoaded: catalog.ready, booksByHash: catalog.byHash };
}

type FinishedLike = Pick<PBook, 'deletedAt' | 'readingStatus' | 'readingStatusUpdatedAt' | 'updatedAt'>;

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

/** Books marked finished from the first day through the last day (both included) of a window. */
export function countFinishedBetween(library: FinishedLike[], firstDay: Date, lastDay: Date): number {
  const from = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate()).getTime();
  const to = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1).getTime();
  return library.filter((b) => {
    if (b.deletedAt || b.readingStatus !== 'finished') return false;
    const at = b.readingStatusUpdatedAt ?? b.updatedAt ?? 0;
    return at >= from && at < to;
  }).length;
}

export const countFinishedInRange = (library: FinishedLike[], range: StatsRange, now: Date) =>
  countFinishedSince(library, rangeStart(range, now));

export const countFinishedThisYear = (library: FinishedLike[], now: Date) =>
  countFinishedSince(library, new Date(now.getFullYear(), 0, 1));
