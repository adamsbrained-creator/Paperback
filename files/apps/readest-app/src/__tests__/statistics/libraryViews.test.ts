import { describe, it, expect } from 'vitest';
import {
  authorRows,
  filterLibrary,
  shelfSections,
  sortRecent,
  statusLabel,
  statusOf,
  currentlyReading,
  finishedBooks,
  finishedYears,
  initialsOf,
  lastReadMap,
  progressPercent,
  recentlyRead,
  recentPace,
  relativeTime,
  timeLeftLabel,
  todayTotals,
  type BookLike,
} from '@/services/paperback/libraryViews';
import type { StatEventRow } from '@/services/statistics/statsAggregate';

const book = (hash: string, over: Partial<BookLike> = {}): BookLike => ({
  hash,
  title: hash,
  author: 'Anon',
  updatedAt: new Date(2026, 9, 1).getTime(),
  ...over,
});
const ev = (md5: string, page: number, startTime: number, duration = 60): StatEventRow => ({
  md5, title: md5, authors: '', page, startTime, duration, totalPages: 300,
});
const at = (y: number, m: number, d: number, h = 12) => Math.floor(new Date(y, m - 1, d, h).getTime() / 1000);
const NOW = new Date(2026, 9, 8, 20, 0);

describe('library views', () => {
  it('progress percent', () => {
    expect(progressPercent(book('a', { progress: [112, 268] }))).toBe(42);
    expect(progressPercent(book('a'))).toBe(0);
    expect(progressPercent(book('a', { progress: [5, 0] }))).toBe(0);
  });

  it('currently reading: reading or in-progress, never finished/abandoned/unread, newest first', () => {
    const lib = [
      book('old', { progress: [10, 100] }),
      book('new', { readingStatus: 'reading', progress: [50, 100] }),
      book('done', { readingStatus: 'finished', progress: [100, 100] }),
      book('drop', { readingStatus: 'abandoned', progress: [20, 100] }),
      book('reset', { readingStatus: 'unread', progress: [20, 100] }),
      book('fresh'),
      book('gone', { readingStatus: 'reading', deletedAt: 1 }),
    ];
    const lastRead = lastReadMap([ev('new', 1, at(2026, 10, 7)), ev('old', 1, at(2026, 10, 3))]);
    expect(currentlyReading(lib, lastRead).map((b) => b.hash)).toEqual(['new', 'old']);
  });

  it('recently read orders by last recorded page visit, falls back to updatedAt', () => {
    const lib = [
      book('a', { progress: [1, 10] }),
      book('b', { progress: [1, 10], updatedAt: new Date(2026, 9, 5).getTime() }),
      book('never'),
    ];
    const lr = lastReadMap([ev('a', 1, at(2026, 10, 2))]);
    expect(recentlyRead(lib, lr).map((b) => b.hash)).toEqual(['b', 'a']);
  });

  it('finished books and years', () => {
    const lib = [
      book('x', { readingStatus: 'finished', readingStatusUpdatedAt: new Date(2025, 5, 1).getTime() }),
      book('y', { readingStatus: 'finished', readingStatusUpdatedAt: new Date(2026, 1, 1).getTime() }),
      book('z', { readingStatus: 'reading' }),
    ];
    expect(finishedBooks(lib).map((b) => b.hash)).toEqual(['y', 'x']);
    expect(finishedYears(lib, NOW)).toEqual([2026, 2025]);
    expect(finishedYears([], NOW)).toEqual([2026]);
  });

  it('authors: grouped, counted, sorted, with initials', () => {
    const rows = authorRows([
      book('1', { author: 'M. Ellery' }),
      book('2', { author: 'M. Ellery' }),
      book('3', { author: ' A. Brandt ' }),
      book('4', { author: '' }),
    ]);
    expect(rows[0]).toEqual({ name: 'M. Ellery', count: 2, initials: 'ME' });
    expect(rows.map((r) => r.name)).toEqual(['M. Ellery', 'A. Brandt', 'Unknown author']);
    expect(initialsOf('Plato')).toBe('PL');
  });

  it('relative time', () => {
    const sec = (d: Date) => Math.floor(d.getTime() / 1000);
    expect(relativeTime(sec(new Date(2026, 9, 8, 18, 0)), NOW)).toBe('Opened 2h ago');
    expect(relativeTime(sec(new Date(2026, 9, 8, 19, 40)), NOW)).toBe('Opened 20m ago');
    expect(relativeTime(sec(new Date(2026, 9, 7, 22, 0)), NOW)).toBe('Yesterday');
    expect(relativeTime(sec(new Date(2026, 8, 30, 21, 0)), NOW)).toBe('Sep 30');
  });

  it('pace, time left, today', () => {
    const events = Array.from({ length: 20 }, (_, i) => ev('a', i + 1, at(2026, 10, 7, 9) + i * 60, 60));
    // 20 pages in 20 minutes = 60 p/h
    expect(recentPace(events, NOW)).toBe(60);
    expect(recentPace(events.slice(0, 3), NOW)).toBe(0); // < 10 min of data
    expect(timeLeftLabel(book('a', { progress: [100, 220] }), 60)).toBe('2h left');
    expect(timeLeftLabel(book('a', { progress: [100, 220] }), 0)).toBe(null);
    expect(timeLeftLabel(book('a', { progress: [220, 220] }), 60)).toBe(null);
    const today = todayTotals([ev('a', 1, at(2026, 10, 8, 9)), ev('a', 2, at(2026, 10, 7, 9))], NOW);
    expect(today).toEqual({ seconds: 60, pages: 1 });
  });
});

describe('library screen helpers', () => {
  const lib: BookLike[] = [
    book('r', { progress: [62, 100], title: 'Moby-Dick', author: 'Herman Melville' }),
    book('f', { readingStatus: 'finished', title: 'Jane Eyre', author: 'C. Bronte' }),
    book('w', { title: 'Walden', author: 'H. D. Thoreau' }),
    book('x', { readingStatus: 'abandoned', progress: [5, 100], title: 'Dropped' }),
    book('gone', { deletedAt: 1 }),
  ];

  it('status and label', () => {
    expect(lib.slice(0, 4).map(statusOf)).toEqual(['reading', 'finished', 'want', 'want']);
    expect(lib.slice(0, 3).map(statusLabel)).toEqual(['62%', 'Finished', 'Not started']);
  });

  it('filters by status and by title/author text', () => {
    const live = lib.filter((b) => !b.deletedAt);
    expect(filterLibrary(live, 'all', '').length).toBe(4);
    expect(filterLibrary(live, 'finished', '').map((b) => b.hash)).toEqual(['f']);
    expect(filterLibrary(live, 'all', ' thoreau ').map((b) => b.hash)).toEqual(['w']);
    expect(filterLibrary(live, 'reading', 'walden')).toEqual([]);
  });

  it('sections and recency order', () => {
    const sec = shelfSections(lib.filter((b) => !b.deletedAt));
    expect([sec.reading.length, sec.finished.length, sec.want.length]).toEqual([1, 1, 2]);
    const lr = new Map([['w', 9999999999]]);
    expect(sortRecent(lib, lr).map((b) => b.hash)[0]).toBe('w');
    expect(sortRecent(lib, lr).some((b) => b.hash === 'gone')).toBe(false);
  });
});
