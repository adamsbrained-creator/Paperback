'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseCatalog, serializeCatalog, toPBook, type PBook, type RawBook } from '@/services/paperback/library';

export const CATALOG_STORAGE_KEY = 'paperback.catalog.v1';

/**
 * Paperback's own list of books.
 *  - Shown from Paperback's saved copy right away on launch.
 *  - Replaced by the live list as soon as `source` (Readest's library) has loaded, and the saved
 *    copy is refreshed (at most every 1.5 s).
 * Returns every book (deleted ones included, as in Readest), a hash lookup of the live ones, and
 * `ready` once there is something trustworthy to show.
 */
export function useCatalog(source: RawBook[], sourceLoaded: boolean) {
  const [stored, setStored] = useState<PBook[] | null>(null);

  useEffect(() => {
    try {
      const text = localStorage.getItem(CATALOG_STORAGE_KEY);
      setStored(text ? parseCatalog(text) : []);
    } catch {
      setStored([]);
    }
  }, []);

  const fresh = useMemo(() => (sourceLoaded ? source.map((b) => toPBook(b)) : null), [source, sourceLoaded]);
  const books = useMemo(() => fresh ?? stored ?? [], [fresh, stored]);

  const latest = useRef<PBook[] | null>(null);
  latest.current = fresh;
  const save = (list: PBook[]) => {
    try {
      localStorage.setItem(CATALOG_STORAGE_KEY, serializeCatalog(list, Date.now()));
    } catch (e) {
      console.warn('[paperback] could not save the library copy:', e);
    }
  };

  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => save(fresh), 1500);
    return () => clearTimeout(t);
  }, [fresh]);

  // Leaving the screen within 1.5 s must not lose the latest list.
  useEffect(
    () => () => {
      if (latest.current) save(latest.current);
    },
    [],
  );

  const byHash = useMemo(() => {
    const map = new Map<string, PBook>();
    for (const b of books) if (!b.deletedAt) map.set(b.hash, b);
    return map;
  }, [books]);

  const ready = sourceLoaded || (stored !== null && stored.length > 0);
  return { books, byHash, ready };
}
