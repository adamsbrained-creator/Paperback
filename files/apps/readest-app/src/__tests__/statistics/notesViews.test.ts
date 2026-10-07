import { describe, it, expect } from 'vitest';
import {
  dayLabel,
  extractNotes,
  filterNotes,
  groupBookmarks,
  noteColorHex,
  searchBooks,
  searchNotes,
  snippet,
  splitMatches,
  type RawNote,
} from '@/services/paperback/notesViews';

const book = { hash: 'h1', title: 'Salt Season' };
const raw = (over: Partial<RawNote>): RawNote => ({
  id: 'n' + Math.random().toString(36).slice(2, 6),
  type: 'annotation',
  cfi: 'epubcfi(/6/4)',
  createdAt: 1,
  updatedAt: 1,
  ...over,
});

describe('extractNotes', () => {
  it('classifies highlights, notes and bookmarks and drops deleted/empty ones', () => {
    const rows = extractNotes(book, [
      raw({ id: 'a', text: '  The harbor kept\n its own hours. ', color: 'yellow' }),
      raw({ id: 'b', text: 'Nets', note: 'one for every year', updatedAt: 5 }),
      raw({ id: 'c', type: 'bookmark', text: 'Chapter 3', page: 112 }),
      raw({ id: 'd', text: 'gone', deletedAt: 9 }),
      raw({ id: 'e', text: '', note: '' }),
      raw({ id: 'f', type: 'weird', text: 'x' }),
    ]);
    expect(rows.map((r) => [r.key, r.kind])).toEqual([
      ['h1:a', 'highlight'],
      ['h1:b', 'note'],
      ['h1:c', 'bookmark'],
    ]);
    expect(rows[0]!.text).toBe('The harbor kept its own hours.');
    expect(rows[0]!.color).toBe('#ffe066');
    expect(rows[1]!.at).toBe(5);
    expect(rows[2]!.page).toBe(112);
    expect(extractNotes(book, undefined)).toEqual([]);
  });

  it('colors', () => {
    expect(noteColorHex('blue')).toBe('#b9c4f2');
    expect(noteColorHex('#abcdef')).toBe('#abcdef');
    expect(noteColorHex('javascript:x')).toBe('#ffe066');
    expect(noteColorHex(undefined)).toBe('#ffe066');
  });
});

describe('filters, groups, search', () => {
  const rows = extractNotes(book, [
    raw({ id: 'a', text: 'harbor lights', updatedAt: 3 }),
    raw({ id: 'b', text: 'nets', note: 'my harbor note', updatedAt: 4 }),
    raw({ id: 'c', type: 'bookmark', text: 'Ch 1', updatedAt: 2 }),
    raw({ id: 'd', type: 'bookmark', text: 'Ch 3', updatedAt: 6 }),
  ]);

  it('filterNotes never returns bookmarks', () => {
    expect(filterNotes(rows, 'all')).toHaveLength(2);
    expect(filterNotes(rows, 'highlights').map((r) => r.kind)).toEqual(['highlight']);
    expect(filterNotes(rows, 'notes').map((r) => r.kind)).toEqual(['note']);
  });

  it('groupBookmarks orders newest first inside a book', () => {
    const g = groupBookmarks(rows);
    expect(g).toHaveLength(1);
    expect(g[0]!.bookmarks.map((b) => b.text)).toEqual(['Ch 3', 'Ch 1']);
  });

  it('search', () => {
    expect(searchBooks([{ title: 'Low Tide', author: 'A. Brandt' }], 'brandt')).toHaveLength(1);
    expect(searchBooks([{ title: 'x', author: '' }], '  ')).toEqual([]);
    expect(searchNotes(rows, 'HARBOR').map((r) => r.at)).toEqual([4, 3]);
    expect(searchNotes(rows, 'zzz')).toEqual([]);
  });

  it('splitMatches and snippet', () => {
    expect(splitMatches('The Harbor kept', 'harbor')).toEqual([
      { text: 'The ', hit: false },
      { text: 'Harbor', hit: true },
      { text: ' kept', hit: false },
    ]);
    expect(splitMatches('abc', '')).toEqual([{ text: 'abc', hit: false }]);
    const long = 'a'.repeat(100) + 'harbor' + 'b'.repeat(100);
    expect(snippet(long, 'harbor')).toContain('harbor');
    expect(snippet(long, 'harbor').startsWith('…')).toBe(true);
    expect(snippet('short harbor', 'harbor')).toBe('short harbor');
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 9, 8, 20, 0);
  it('labels recent days and dates', () => {
    expect(dayLabel(new Date(2026, 9, 8, 9).getTime(), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 9, 7, 23).getTime(), now)).toBe('Yesterday');
    expect(dayLabel(new Date(2026, 8, 30, 12).getTime(), now)).toBe('Sep 30');
    expect(dayLabel(new Date(2025, 11, 31, 12).getTime(), now)).toBe('Dec 31, 2025');
  });
});
