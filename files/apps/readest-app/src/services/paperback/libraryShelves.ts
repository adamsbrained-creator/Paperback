// Paperback: the Library screens' lists. Pure helpers; no React, no I/O.
// Shelves (the home layout), the filter chips + sort of "All books", and the short lines under covers.

import {
  finishedBooks,
  lastReadAt,
  liveBooks,
  progressPercent,
  statusOf,
  type BookLike,
} from './libraryViews';

// ---- filters and sorting (All books) -------------------------------------------------------

export type GridFilter = 'all' | 'reading' | 'unread' | 'favorites' | 'finished';

export const GRID_FILTERS: { id: GridFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'unread', label: 'Not started' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'finished', label: 'Finished' },
];

export type SortId = 'recent' | 'added' | 'title' | 'author';

export const SORTS: { id: SortId; label: string }[] = [
  { id: 'recent', label: 'Recently opened' },
  { id: 'added', label: 'Recently added' },
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
];

export const parseGridFilter = (v: unknown): GridFilter =>
  GRID_FILTERS.some((f) => f.id === v) ? (v as GridFilter) : 'all';

export const parseSort = (v: unknown): SortId => (SORTS.some((s) => s.id === v) ? (v as SortId) : 'recent');

type Sortable = BookLike & { createdAt?: number };

export function sortBooks<T extends Sortable>(books: T[], sort: SortId, lastRead: Map<string, number>): T[] {
  const list = [...books];
  const byTitle = (a: T, b: T) => a.title.localeCompare(b.title);
  switch (sort) {
    case 'added':
      return list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || byTitle(a, b));
    case 'title':
      return list.sort(byTitle);
    case 'author':
      return list.sort((a, b) => (a.author || '').localeCompare(b.author || '') || byTitle(a, b));
    default:
      return list.sort((a, b) => lastReadAt(b, lastRead) - lastReadAt(a, lastRead) || byTitle(a, b));
  }
}

export function filterBooks<T extends BookLike>(
  books: T[],
  filter: GridFilter,
  favorites: readonly string[],
  query = '',
): T[] {
  const q = query.trim().toLowerCase();
  const fav = new Set(favorites);
  return books.filter((b) => {
    if (filter === 'reading' && statusOf(b) !== 'reading') return false;
    if (filter === 'unread' && statusOf(b) !== 'want') return false;
    if (filter === 'finished' && statusOf(b) !== 'finished') return false;
    if (filter === 'favorites' && !fav.has(b.hash)) return false;
    return !q || b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
  });
}

// ---- shelves (the home layout) --------------------------------------------------------------

export type ShelfId = 'reading' | 'unread' | 'favorites' | 'finished';

export interface Shelf<T> {
  id: ShelfId;
  label: string;
  books: T[];
}

export interface ShelvesLayout<T> {
  /** The book to continue: the one you read last. */
  resume: T | null;
  shelves: Shelf<T>[];
}

/**
 * "Continue reading" card + shelves: Also reading, Not started, Favorites (always shown), Finished.
 * Empty shelves other than Favorites are left out.
 */
export function buildShelves<T extends Sortable>(
  books: T[],
  lastRead: Map<string, number>,
  favorites: readonly string[],
): ShelvesLayout<T> {
  const live = sortBooks(liveBooks(books), 'recent', lastRead);
  const fav = new Set(favorites);
  const reading = live.filter((b) => statusOf(b) === 'reading');
  const shelves: Shelf<T>[] = [
    { id: 'reading', label: 'Also reading', books: reading.slice(1) },
    { id: 'unread', label: 'Not started', books: live.filter((b) => statusOf(b) === 'want') },
    { id: 'favorites', label: 'Favorites', books: live.filter((b) => fav.has(b.hash)) },
    { id: 'finished', label: 'Finished', books: finishedBooks(live) },
  ];
  return {
    resume: reading[0] ?? null,
    shelves: shelves.filter((s) => s.id === 'favorites' || s.books.length > 0),
  };
}

/** "See all" on a shelf opens All books with the matching chip selected. */
export const filterForShelf = (id: ShelfId): GridFilter => id;

/** "100 pages", or nothing when the page count is not known yet. */
export function pagesLabel(b: BookLike): string {
  const total = b.progress?.[1];
  return total && total > 0 ? `${total} pages` : '';
}

/** The small line under a cover on a shelf: "38% read", "100 pages", … */
export function shelfMeta(id: ShelfId, b: BookLike): string {
  switch (id) {
    case 'reading':
      return `${progressPercent(b)}% read`;
    case 'finished':
      return pagesLabel(b) || 'Finished';
    case 'unread':
      return pagesLabel(b) || 'Not started';
    default: {
      const st = statusOf(b);
      return st === 'reading' ? `${progressPercent(b)}% read` : st === 'finished' ? 'Finished' : pagesLabel(b) || 'Not started';
    }
  }
}

/** "Page 7 of 178", or "Not started" when there is no progress yet. */
export function resumeLine(b: BookLike): string {
  const p = b.progress;
  if (!p || !(p[1] > 0) || p[0] <= 0) return 'Not started';
  return `Page ${p[0]} of ${p[1]}`;
}

/** "4% · 178 pages" under the title in the book sheet. */
export function sheetProgressLine(b: BookLike): string {
  const pages = pagesLabel(b);
  const pct = `${progressPercent(b)}%`;
  return pages ? `${pct} · ${pages}` : pct;
}

/** "8 books" / "1 book" for the header chip. */
export const bookCountLabel = (n: number): string => `${n} ${n === 1 ? 'book' : 'books'}`;
