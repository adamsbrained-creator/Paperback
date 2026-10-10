import { describe, it, expect } from 'vitest';
import { parseCatalog, serializeCatalog, toPBook, type RawBook } from '@/services/paperback/library';

const raw = (over: Partial<RawBook> = {}): RawBook => ({
  hash: 'h1',
  title: 'Moby-Dick',
  author: 'Herman Melville',
  format: 'EPUB',
  createdAt: 100,
  updatedAt: 200,
  ...over,
});

describe('toPBook', () => {
  it('maps the fields Paperback reads and keeps a pointer to the source', () => {
    const r = raw({ progress: [10, 300], readingStatus: 'reading', tags: [' Sci-fi ', ''], metadata: { language: ['en', 'fr'] } });
    const b = toPBook(r);
    expect([b.hash, b.title, b.author, b.format, b.language]).toEqual(['h1', 'Moby-Dick', 'Herman Melville', 'EPUB', 'en']);
    expect(b.tags).toEqual(['Sci-fi']);
    expect(b.progress).toEqual([10, 300]);
    expect([b.readingStatus, b.deletedAt]).toEqual(['reading', null]);
    expect(b.source).toBe(r);
  });

  it('language: primaryLanguage wins, then a string, then empty', () => {
    expect(toPBook(raw({ primaryLanguage: 'de', metadata: { language: 'en' } })).language).toBe('de');
    expect(toPBook(raw({ metadata: { language: 'es' } })).language).toBe('es');
    expect(toPBook(raw()).language).toBe('');
    expect(toPBook(raw({ author: undefined as unknown as string })).author).toBe('');
  });
});

describe('saved copy', () => {
  it('round-trips without the source pointer', () => {
    const books = [toPBook(raw({ progress: [5, 50], deletedAt: 9 })), toPBook(raw({ hash: 'h2', title: 'Walden' }))];
    const text = serializeCatalog(books, 1234);
    expect(text.includes('source')).toBe(false);
    const back = parseCatalog(text);
    expect(back).toHaveLength(2);
    expect(back[0]!.progress).toEqual([5, 50]);
    expect(back[0]!.deletedAt).toBe(9);
    expect(back[1]!.title).toBe('Walden');
    expect(back[1]!.source).toBe(undefined);
  });

  it('survives junk', () => {
    expect(parseCatalog('nope')).toEqual([]);
    expect(parseCatalog('{"version":2,"books":[]}')).toEqual([]);
    expect(parseCatalog('{"version":1,"books":"x"}')).toEqual([]);
    const ok = parseCatalog('{"version":1,"books":[{"hash":"a","title":"T","progress":[1]},{"hash":""},null]}');
    expect(ok).toHaveLength(1);
    expect(ok[0]!.progress).toBe(null);
  });
});
