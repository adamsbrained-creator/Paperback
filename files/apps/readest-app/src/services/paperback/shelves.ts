// Paperback: personal shelves — favorites, star ratings, wishlist and collections.
// Pure reducers + selectors over one small JSON-able object (stored in localStorage by the UI).

import { progressFraction, type BookLike } from './libraryViews';

export interface WishItem {
  id: string;
  title: string;
  author: string;
  addedAt: number; // ms
}

export interface Collection {
  id: string;
  name: string;
  hashes: string[];
}

export interface SavedWord {
  word: string;
  note: string; // a short definition snippet
  addedAt: number; // ms
}

export const MAX_PINNED = 3;

export interface Shelves {
  version: 1;
  favorites: string[]; // book hashes
  ratings: Record<string, number>; // hash -> 1..5
  wishlist: WishItem[];
  collections: Collection[];
  savedWords: SavedWord[];
  pinned: string[]; // up to MAX_PINNED book hashes, shown first
  journal: Record<string, string>; // hash -> your own note about the book
}

export interface ShelfBook extends BookLike {
  tags?: string[];
  createdAt?: number; // ms
}

export const emptyShelves = (): Shelves => ({
  version: 1,
  favorites: [],
  ratings: {},
  wishlist: [],
  collections: [],
  savedWords: [],
  pinned: [],
  journal: {},
});

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Accepts whatever came out of storage (or a backup file) and returns a valid Shelves. */
export function normalizeShelves(raw: unknown): Shelves {
  const out = emptyShelves();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;

  if (Array.isArray(r['favorites'])) {
    out.favorites = [...new Set(r['favorites'].filter((x): x is string => typeof x === 'string'))];
  }
  if (r['ratings'] && typeof r['ratings'] === 'object') {
    for (const [hash, v] of Object.entries(r['ratings'] as Record<string, unknown>)) {
      const n = Math.round(Number(v));
      if (n >= 1 && n <= 5) out.ratings[hash] = n;
    }
  }
  if (Array.isArray(r['wishlist'])) {
    for (const w of r['wishlist'] as Record<string, unknown>[]) {
      const title = str(w?.['title']);
      if (!title) continue;
      out.wishlist.push({
        id: str(w['id']) || `w-${out.wishlist.length}-${title}`,
        title,
        author: str(w['author']),
        addedAt: Number(w['addedAt']) || 0,
      });
    }
  }
  if (Array.isArray(r['collections'])) {
    for (const c of r['collections'] as Record<string, unknown>[]) {
      const name = str(c?.['name'], 80);
      const id = str(c?.['id']);
      if (!name || !id) continue;
      const hashes = Array.isArray(c['hashes'])
        ? [...new Set((c['hashes'] as unknown[]).filter((x): x is string => typeof x === 'string'))]
        : [];
      out.collections.push({ id, name, hashes });
    }
  }
  if (r['journal'] && typeof r['journal'] === 'object') {
    for (const [hash, v] of Object.entries(r['journal'] as Record<string, unknown>)) {
      const text = typeof v === 'string' ? v.slice(0, 20000) : '';
      if (text.trim()) out.journal[hash] = text;
    }
  }
  if (Array.isArray(r['pinned'])) {
    out.pinned = [...new Set(r['pinned'].filter((x): x is string => typeof x === 'string'))].slice(0, MAX_PINNED);
  }
  if (Array.isArray(r['savedWords'])) {
    const seen = new Set<string>();
    for (const w of r['savedWords'] as Record<string, unknown>[]) {
      const word = str(w?.['word'], 80);
      if (!word || seen.has(word.toLowerCase())) continue;
      seen.add(word.toLowerCase());
      out.savedWords.push({ word, note: str(w['note'], 300), addedAt: Number(w['addedAt']) || 0 });
    }
  }
  return out;
}

// ---- reducers (all return a new object) ------------------------------------------------

export const isFavorite = (s: Shelves, hash: string) => s.favorites.includes(hash);

export const toggleFavorite = (s: Shelves, hash: string): Shelves => ({
  ...s,
  favorites: isFavorite(s, hash) ? s.favorites.filter((h) => h !== hash) : [...s.favorites, hash],
});

/** stars 1..5 sets the rating; 0 (or tapping the same value) clears it. */
export function setRating(s: Shelves, hash: string, stars: number): Shelves {
  const ratings = { ...s.ratings };
  const n = Math.round(stars);
  if (n < 1 || n > 5 || ratings[hash] === n) delete ratings[hash];
  else ratings[hash] = n;
  return { ...s, ratings };
}

export function averageRating(s: Shelves, hashes?: string[]): number | null {
  const values = Object.entries(s.ratings)
    .filter(([h]) => !hashes || hashes.includes(h))
    .map(([, v]) => v);
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function addWish(s: Shelves, title: string, author: string, id: string, now: number): Shelves {
  const t = str(title);
  if (!t) return s;
  return { ...s, wishlist: [{ id, title: t, author: str(author), addedAt: now }, ...s.wishlist] };
}

export const removeWish = (s: Shelves, id: string): Shelves => ({
  ...s,
  wishlist: s.wishlist.filter((w) => w.id !== id),
});

export function createCollection(s: Shelves, name: string, id: string): Shelves {
  const n = str(name, 80);
  if (!n) return s;
  return { ...s, collections: [...s.collections, { id, name: n, hashes: [] }] };
}

export function renameCollection(s: Shelves, id: string, name: string): Shelves {
  const n = str(name, 80);
  if (!n) return s;
  return { ...s, collections: s.collections.map((c) => (c.id === id ? { ...c, name: n } : c)) };
}

export const deleteCollection = (s: Shelves, id: string): Shelves => ({
  ...s,
  collections: s.collections.filter((c) => c.id !== id),
});

export const inCollection = (s: Shelves, id: string, hash: string) =>
  !!s.collections.find((c) => c.id === id)?.hashes.includes(hash);

export const toggleInCollection = (s: Shelves, id: string, hash: string): Shelves => ({
  ...s,
  collections: s.collections.map((c) =>
    c.id !== id
      ? c
      : { ...c, hashes: c.hashes.includes(hash) ? c.hashes.filter((h) => h !== hash) : [...c.hashes, hash] },
  ),
});

/** Saves (or refreshes) a word; newest first, one entry per word regardless of case. */
export function saveWord(s: Shelves, word: string, note: string, now: number): Shelves {
  const w = str(word, 80);
  if (!w) return s;
  const rest = s.savedWords.filter((x) => x.word.toLowerCase() !== w.toLowerCase());
  return { ...s, savedWords: [{ word: w, note: str(note, 300), addedAt: now }, ...rest] };
}

export const removeWord = (s: Shelves, word: string): Shelves => ({
  ...s,
  savedWords: s.savedWords.filter((x) => x.word.toLowerCase() !== word.toLowerCase()),
});

export const isWordSaved = (s: Shelves, word: string): boolean =>
  s.savedWords.some((x) => x.word.toLowerCase() === word.trim().toLowerCase());

/** Sets your note about a book; an empty note removes it. */
export function setJournal(s: Shelves, hash: string, text: string): Shelves {
  const journal = { ...s.journal };
  if (text.trim()) journal[hash] = text.slice(0, 20000);
  else delete journal[hash];
  return { ...s, journal };
}

export const isPinned = (s: Shelves, hash: string) => s.pinned.includes(hash);

/** Pin or unpin. When the pins are full, pinning another drops the oldest one. */
export function togglePin(s: Shelves, hash: string): Shelves {
  if (isPinned(s, hash)) return { ...s, pinned: s.pinned.filter((h) => h !== hash) };
  return { ...s, pinned: [...s.pinned, hash].slice(-MAX_PINNED) };
}

/** Stable: pinned items first (in pin order), everything else keeps its order. */
export function pinnedFirst<T extends { hash: string }>(books: T[], pinned: string[]): T[] {
  const rank = (b: T) => {
    const i = pinned.indexOf(b.hash);
    return i < 0 ? Infinity : i;
  };
  return books
    .map((b, i) => ({ b, i, r: rank(b) }))
    .sort((x, y) => (x.r === y.r ? x.i - y.i : x.r - y.r))
    .map((x) => x.b);
}

// ---- views -----------------------------------------------------------------------------

const isUnread = (b: ShelfBook): boolean =>
  (!b.readingStatus || b.readingStatus === 'unread') && progressFraction(b) === 0;

const sameMonth = (ms: number, now: Date) => {
  const d = new Date(ms);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export type CollectionKind = 'auto' | 'favorites' | 'manual' | 'tag';

export interface ResolvedCollection<T> {
  id: string;
  name: string;
  kind: CollectionKind;
  note: string; // "Automatic", "Your collection", "Tag"
  books: T[];
}

const live = <T extends ShelfBook>(lib: T[]) => lib.filter((b) => !b.deletedAt);

/** Ids: `auto:unread-month`, `auto:unread`, `fav`, `tag:<name>`, or a manual collection id. */
export function resolveCollection<T extends ShelfBook>(
  id: string,
  library: T[],
  s: Shelves,
  now: Date,
): ResolvedCollection<T> | null {
  const books = live(library);
  if (id === 'auto:unread-month') {
    return {
      id, kind: 'auto', note: 'Automatic', name: 'Unread this month',
      books: books.filter((b) => isUnread(b) && !!b.createdAt && sameMonth(b.createdAt, now)),
    };
  }
  if (id === 'auto:unread') {
    return { id, kind: 'auto', note: 'Automatic', name: 'Not started', books: books.filter(isUnread) };
  }
  if (id === 'fav') {
    return {
      id, kind: 'favorites', note: 'Your favorites', name: 'Favorites',
      books: books.filter((b) => s.favorites.includes(b.hash)),
    };
  }
  if (id.startsWith('tag:')) {
    const tag = id.slice(4);
    return {
      id, kind: 'tag', note: 'Tag', name: tag,
      books: books.filter((b) => (b.tags ?? []).some((t) => t.trim() === tag)),
    };
  }
  const c = s.collections.find((x) => x.id === id);
  if (!c) return null;
  const set = new Set(c.hashes);
  return { id, kind: 'manual', note: 'Your collection', name: c.name, books: books.filter((b) => set.has(b.hash)) };
}

/** Everything shown on the Collections screen, automatic ones first. */
export function listCollections<T extends ShelfBook>(
  library: T[],
  s: Shelves,
  now: Date,
): ResolvedCollection<T>[] {
  const ids = ['auto:unread-month', 'auto:unread', 'fav', ...s.collections.map((c) => c.id)];
  return ids
    .map((id) => resolveCollection(id, library, s, now))
    .filter((c): c is ResolvedCollection<T> => c !== null);
}

export interface GenreRow {
  tag: string;
  count: number;
}

/** Tags used on your books, most used first. */
export function genreRows(library: ShelfBook[]): GenreRow[] {
  const counts = new Map<string, number>();
  for (const b of live(library)) {
    for (const raw of new Set((b.tags ?? []).map((t) => t.trim()).filter(Boolean))) {
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
