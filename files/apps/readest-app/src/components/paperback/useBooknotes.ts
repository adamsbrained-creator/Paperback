'use client';

import { useEffect, useState } from 'react';
import { useEnv } from '@/components/paperback/platform';
import { sourceBook, useSettingsStore } from '@/components/paperback/platform';
import { extractNotes, type NoteRow } from '@/services/paperback/notesViews';
import type { PBook } from '@/services/paperback/library';

/**
 * Reads the notes, highlights and bookmarks of `books` from their per-book config
 * files (read-only). Returns null until the first load finishes.
 */
export function useBooknotes(books: PBook[], enabled = true): NoteRow[] | null {
  const { appService } = useEnv();
  const settings = useSettingsStore((s) => s.settings);
  const [rows, setRows] = useState<NoteRow[] | null>(null);
  const key = books.map((b) => b.hash).join(',');

  useEffect(() => {
    if (!enabled || !appService) return;
    let cancelled = false;
    (async () => {
      const all: NoteRow[] = [];
      let next = 0;
      const worker = async () => {
        while (next < books.length) {
          const book = books[next++]!;
          const src = sourceBook(book);
          if (!src) continue;
          try {
            const config = await appService.loadBookConfig(src, settings);
            all.push(...extractNotes(book, config.booknotes));
          } catch (e) {
            console.warn('[paperback] could not read notes of', book.title, e);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(6, books.length) }, worker));
      if (!cancelled) setRows(all);
    })();
    return () => {
      cancelled = true;
    };
    // `settings` is only needed for defaults and must not re-trigger a full reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appService, key, enabled]);

  return rows;
}
