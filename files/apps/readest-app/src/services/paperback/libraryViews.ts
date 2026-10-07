// Paperback: pure helpers that turn the library list (+ reading events) into
// the lists the Paperback screens show. No React, no I/O.

import {
  computeSummary,
  formatDuration,
  type StatEventRow,
} from '@/services/statistics/statsAggregate';

export interface BookLike {
  hash: string;
  title: string;
  author: string;
  deletedAt?: number | null;
  readingStatus?: string;
  readingStatusUpdatedAt?: number;
  updatedAt: number; // ms
  progress?: [number, number] | null; // [current page (1-based), total pages]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const liveBooks = <T extends BookLike>(library: T[]): T[] =>
  library.filter((b) => !b.deletedAt);

export function progressFraction(b: BookLike): number {
  const p = b.progress;
  if (!p || !(p[1] > 0)) return 0;
  return Math.max(0, Math.min(1, p[0] / p[1]));
}

export const progressPercent = (b: BookLike): number => Math.round(progressFraction(b) * 100);

/** md5 → Unix seconds of the last page visit we recorded for it. */
export function lastReadMap(events: StatEventRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const end = e.startTime + Math.max(0, Math.min(e.duration, 120));
    if (end > (map.get(e.md5) ?? 0)) map.set(e.md5, end);
  }
  return map;
}

/** Unix seconds. Falls back to the library row's updatedAt when no events exist. */
export const lastReadAt = (b: BookLike, lastRead: Map<string, number>): number =>
  lastRead.get(b.hash) ?? Math.floor(b.updatedAt / 1000);

/** In progress: marked reading, or has progress and isn't finished, dropped or reset. */
export function isReadingNow(b: BookLike): boolean {
  const s = b.readingStatus;
  if (s === 'finished' || s === 'abandoned' || s === 'unread') return false;
  return s === 'reading' || progressFraction(b) > 0;
}

export function currentlyReading<T extends BookLike>(
  library: T[],
  lastRead: Map<string, number>,
): T[] {
  return liveBooks(library)
    .filter(isReadingNow)
    .sort((a, b) => lastReadAt(b, lastRead) - lastReadAt(a, lastRead));
}

export function recentlyRead<T extends BookLike>(
  library: T[],
  lastRead: Map<string, number>,
  limit = 30,
): T[] {
  return liveBooks(library)
    .filter((b) => lastRead.has(b.hash) || progressFraction(b) > 0)
    .sort((a, b) => lastReadAt(b, lastRead) - lastReadAt(a, lastRead))
    .slice(0, limit);
}

const finishedStamp = (b: BookLike): number => b.readingStatusUpdatedAt ?? b.updatedAt;

export const finishedBooks = <T extends BookLike>(library: T[]): T[] =>
  liveBooks(library)
    .filter((b) => b.readingStatus === 'finished')
    .sort((a, b) => finishedStamp(b) - finishedStamp(a));

export const finishedYear = (b: BookLike): number => new Date(finishedStamp(b)).getFullYear();

/** Years that have finished books, newest first; always includes `now`'s year. */
export function finishedYears(library: BookLike[], now: Date): number[] {
  const years = new Set<number>([now.getFullYear()]);
  for (const b of finishedBooks(library)) years.add(finishedYear(b));
  return [...years].sort((a, b) => b - a);
}

export interface AuthorRow {
  name: string;
  count: number;
  initials: string;
}

export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function authorRows(library: BookLike[]): AuthorRow[] {
  const counts = new Map<string, number>();
  for (const b of liveBooks(library)) {
    const name = (b.author || '').trim() || 'Unknown author';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, initials: initialsOf(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** "Opened 2h ago" · "Yesterday" · "Sep 30" */
export function relativeTime(sec: number, now: Date): string {
  const d = new Date(sec * 1000);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 864e5;
  const diff = Math.max(0, Math.floor(now.getTime() / 1000) - sec);
  if (d.getTime() >= startToday) {
    if (diff < 60) return 'Opened just now';
    if (diff < 3600) return `Opened ${Math.floor(diff / 60)}m ago`;
    return `Opened ${Math.floor(diff / 3600)}h ago`;
  }
  if (d.getTime() >= startYesterday) return 'Yesterday';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Reading pace over the last 60 days, in pages per hour (0 if not enough data). */
export function recentPace(events: StatEventRow[], now: Date): number {
  const from = Math.floor(now.getTime() / 1000) - 60 * 86400;
  const s = computeSummary(events.filter((e) => e.startTime >= from));
  return s.seconds >= 10 * 60 ? s.pagesPerHour : 0;
}

/** "3h 10m left" — null when there is no pace yet or the book is finished. */
export function timeLeftLabel(b: BookLike, pagesPerHour: number): string | null {
  const p = b.progress;
  if (!p || !(p[1] > 0) || pagesPerHour <= 0) return null;
  const remaining = p[1] - p[0];
  if (remaining <= 0) return null;
  return `${formatDuration((remaining / pagesPerHour) * 3600)} left`;
}

export function todayTotals(events: StatEventRow[], now: Date): { seconds: number; pages: number } {
  const from = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const s = computeSummary(events.filter((e) => e.startTime >= from));
  return { seconds: s.seconds, pages: s.pages };
}

// ---- Library screen ---------------------------------------------------------------------

export type LibraryFilter = 'all' | 'reading' | 'finished' | 'want';
export type BookStatus = 'reading' | 'finished' | 'want';

export function statusOf(b: BookLike): BookStatus {
  if (b.readingStatus === 'finished') return 'finished';
  return isReadingNow(b) ? 'reading' : 'want';
}

/** "62%" · "Finished" · "Not started" */
export function statusLabel(b: BookLike): string {
  const st = statusOf(b);
  if (st === 'finished') return 'Finished';
  if (st === 'reading') return `${progressPercent(b)}%`;
  return 'Not started';
}

/** Live books, newest activity first (last page read, else when the row last changed). */
export function sortRecent<T extends BookLike>(library: T[], lastRead: Map<string, number>): T[] {
  return liveBooks(library).sort(
    (a, b) => lastReadAt(b, lastRead) - lastReadAt(a, lastRead) || a.title.localeCompare(b.title),
  );
}

export function filterLibrary<T extends BookLike>(books: T[], filter: LibraryFilter, query: string): T[] {
  const q = query.trim().toLowerCase();
  return books.filter(
    (b) =>
      (filter === 'all' || statusOf(b) === filter) &&
      (!q || b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q)),
  );
}

export function shelfSections<T extends BookLike>(books: T[]): Record<BookStatus, T[]> {
  const out: Record<BookStatus, T[]> = { reading: [], finished: [], want: [] };
  for (const b of books) out[statusOf(b)].push(b);
  return out;
}
