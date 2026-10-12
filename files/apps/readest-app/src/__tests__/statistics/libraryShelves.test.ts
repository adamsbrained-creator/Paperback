import { describe, it, expect } from 'vitest';
import {
  buildShelves,
  filterBooks,
  parseGridFilter,
  parseSort,
  resumeLine,
  shelfMeta,
  sheetProgressLine,
  sortBooks,
  bookCountLabel,
} from '@/services/paperback/libraryShelves';
import { coverColors, coverInitial, showsFullCover } from '@/services/paperback/bookCovers';

type B = {
  hash: string;
  title: string;
  author: string;
  updatedAt: number;
  createdAt: number;
  readingStatus?: string;
  progress?: [number, number] | null;
  deletedAt?: number | null;
};
const book = (hash: string, over: Partial<B> = {}): B => ({
  hash,
  title: hash,
  author: '',
  updatedAt: 1000,
  createdAt: 1000,
  ...over,
});

const lib: B[] = [
  book('oz', { title: 'Oz', author: 'Baum', progress: [7, 178], updatedAt: 5000 }),
  book('alice', { title: 'Alice', author: 'Carroll', progress: [38, 100], updatedAt: 4000 }),
  book('time', { title: 'Time Machine', author: 'Wells', createdAt: 3000 }),
  book('frank', { title: 'Frankenstein', author: 'Shelley', readingStatus: 'finished', progress: [260, 260] }),
  book('gone', { title: 'Gone', deletedAt: 1 }),
];

describe('buildShelves', () => {
  it('puts the most recent reading book on the card and the other reading books on a shelf', () => {
    const out = buildShelves(lib, new Map(), []);
    expect(out.resume?.hash).toBe('oz');
    const ids = out.shelves.map((s) => s.id);
    expect(ids).toEqual(['reading', 'unread', 'favorites', 'finished']);
    expect(out.shelves[0]!.books.map((b) => b.hash)).toEqual(['alice']);
    expect(out.shelves[1]!.books.map((b) => b.hash)).toEqual(['time']);
    expect(out.shelves[3]!.books.map((b) => b.hash)).toEqual(['frank']);
  });

  it('always keeps Favorites, drops other empty shelves and ignores removed books', () => {
    const out = buildShelves([book('a', { readingStatus: 'finished' })], new Map(), []);
    expect(out.resume).toBeNull();
    expect(out.shelves.map((s) => s.id)).toEqual(['favorites', 'finished']);
    expect(out.shelves[0]!.books).toEqual([]);
    expect(buildShelves(lib, new Map(), []).shelves.flatMap((s) => s.books).some((b) => b.hash === 'gone')).toBe(false);
  });

  it('lists favorites', () => {
    const out = buildShelves(lib, new Map(), ['time']);
    expect(out.shelves.find((s) => s.id === 'favorites')!.books.map((b) => b.hash)).toEqual(['time']);
  });

  it('uses the last-read times to decide what to continue', () => {
    const out = buildShelves(lib, new Map([['alice', 9999]]), []);
    expect(out.resume?.hash).toBe('alice');
  });
});

describe('filterBooks / sortBooks', () => {
  it('filters by chip and search text', () => {
    const live = lib.filter((b) => !b.deletedAt);
    expect(filterBooks(live, 'all', []).length).toBe(4);
    expect(filterBooks(live, 'reading', []).map((b) => b.hash)).toEqual(['oz', 'alice']);
    expect(filterBooks(live, 'unread', []).map((b) => b.hash)).toEqual(['time']);
    expect(filterBooks(live, 'finished', []).map((b) => b.hash)).toEqual(['frank']);
    expect(filterBooks(live, 'favorites', ['alice']).map((b) => b.hash)).toEqual(['alice']);
    expect(filterBooks(live, 'all', [], 'WELLS').map((b) => b.hash)).toEqual(['time']);
  });

  it('sorts four ways', () => {
    const live = lib.filter((b) => !b.deletedAt);
    expect(sortBooks(live, 'title', new Map()).map((b) => b.hash)).toEqual(['alice', 'frank', 'oz', 'time']);
    expect(sortBooks(live, 'author', new Map()).map((b) => b.hash)).toEqual(['oz', 'alice', 'frank', 'time']);
    expect(sortBooks(live, 'added', new Map())[0]!.hash).toBe('time');
    expect(sortBooks(live, 'recent', new Map([['frank', 99999]]))[0]!.hash).toBe('frank');
  });

  it('falls back for unknown values', () => {
    expect(parseGridFilter('nope')).toBe('all');
    expect(parseGridFilter('finished')).toBe('finished');
    expect(parseSort(3)).toBe('recent');
    expect(parseSort('title')).toBe('title');
  });
});

describe('lines under covers', () => {
  it('describes progress and size', () => {
    expect(shelfMeta('reading', lib[1]!)).toBe('38% read');
    expect(shelfMeta('finished', lib[3]!)).toBe('260 pages');
    expect(shelfMeta('unread', lib[2]!)).toBe('Not started');
    expect(resumeLine(lib[0]!)).toBe('Page 7 of 178');
    expect(resumeLine(lib[2]!)).toBe('Not started');
    expect(sheetProgressLine(lib[0]!)).toBe('4% · 178 pages');
    expect(bookCountLabel(1)).toBe('1 book');
    expect(bookCountLabel(8)).toBe('8 books');
  });
});

describe('covers', () => {
  it('gives the same book the same colours', () => {
    expect(coverColors('abc')).toEqual(coverColors('abc'));
    expect(coverColors('abc').bg).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('picks an initial without leading articles and only shows the full cover when wide', () => {
    expect(coverInitial('The Time Machine')).toBe('T');
    expect(coverInitial('A Tale of Two Cities')).toBe('T');
    expect(coverInitial('   ')).toBe('?');
    expect(showsFullCover(96)).toBe(true);
    expect(showsFullCover(84)).toBe(false);
  });
});
