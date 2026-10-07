'use client';

import { useCallback, useEffect, useState } from 'react';
import { emptyShelves, normalizeShelves, type Shelves } from '@/services/paperback/shelves';

export const SHELVES_STORAGE_KEY = 'paperback.shelves.v1';

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Favorites, ratings, wishlist and collections, kept in this device's local storage.
 * Returns [shelves, update(fn), ready]. `update` applies a reducer from shelves.ts and saves.
 */
export function useShelves(): [Shelves, (fn: (s: Shelves) => Shelves) => void, boolean] {
  const [shelves, setShelves] = useState<Shelves>(emptyShelves);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const text = localStorage.getItem(SHELVES_STORAGE_KEY);
      setShelves(normalizeShelves(text ? JSON.parse(text) : null));
    } catch (e) {
      console.warn('[paperback] could not read shelves:', e);
    }
    setReady(true);
  }, []);

  const update = useCallback((fn: (s: Shelves) => Shelves) => {
    setShelves((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(SHELVES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('[paperback] could not save shelves:', e);
      }
      return next;
    });
  }, []);

  return [shelves, update, ready];
}
