import { describe, it, expect } from 'vitest';
import {
  addWish,
  averageRating,
  createCollection,
  deleteCollection,
  emptyShelves,
  genreRows,
  inCollection,
  listCollections,
  normalizeShelves,
  isPinned,
  isWordSaved,
  pinnedFirst,
  togglePin,
  removeWish,
  removeWord,
  saveWord,
  renameCollection,
  resolveCollection,
  setRating,
  toggleFavorite,
  toggleInCollection,
  type ShelfBook,
} from '@/services/paperback/shelves';

const NOW = new Date(2026, 9, 8, 12);
const book = (hash: string, over: Partial<ShelfBook> = {}): ShelfBook => ({
  hash, title: hash, author: 'A', updatedAt: 1, createdAt: new Date(2026, 9, 2).getTime(), ...over,
});

describe('favorites and ratings', () => {
  it('toggles favorites without mutating', () => {
    const a = emptyShelves();
    const b = toggleFavorite(a, 'h1');
    expect(a.favorites).toEqual([]);
    expect(b.favorites).toEqual(['h1']);
    expect(toggleFavorite(b, 'h1').favorites).toEqual([]);
  });

  it('rating: set, replace, clear by tapping the same star, ignore junk', () => {
    let s = setRating(emptyShelves(), 'h', 4);
    expect(s.ratings['h']).toBe(4);
    s = setRating(s, 'h', 5);
    expect(s.ratings['h']).toBe(5);
    expect(setRating(s, 'h', 5).ratings['h']).toBeUndefined();
    expect(setRating(s, 'h', 0).ratings['h']).toBeUndefined();
    expect(setRating(s, 'h', 9).ratings['h']).toBeUndefined();
  });

  it('average rating, optionally for a subset', () => {
    let s = setRating(emptyShelves(), 'a', 5);
    s = setRating(s, 'b', 4);
    s = setRating(s, 'c', 4);
    expect(averageRating(s)).toBe(4.3);
    expect(averageRating(s, ['a'])).toBe(5);
    expect(averageRating(s, ['zzz'])).toBe(null);
    expect(averageRating(emptyShelves())).toBe(null);
  });
});

describe('wishlist and collections', () => {
  it('wishlist adds newest first, trims, ignores empty titles, removes', () => {
    let s = addWish(emptyShelves(), '  Paper Moons ', ' T. Sato ', 'w1', 1);
    s = addWish(s, 'Low Tide', '', 'w2', 2);
    expect(addWish(s, '   ', 'x', 'w3', 3)).toBe(s);
    expect(s.wishlist.map((w) => w.title)).toEqual(['Low Tide', 'Paper Moons']);
    expect(s.wishlist[1]!.author).toBe('T. Sato');
    expect(removeWish(s, 'w2').wishlist).toHaveLength(1);
  });

  it('collections: create, rename, add/remove books, delete', () => {
    let s = createCollection(emptyShelves(), 'Winter', 'c1');
    expect(createCollection(s, '  ', 'c2')).toBe(s);
    s = toggleInCollection(s, 'c1', 'h1');
    expect(inCollection(s, 'c1', 'h1')).toBe(true);
    s = toggleInCollection(s, 'c1', 'h1');
    expect(inCollection(s, 'c1', 'h1')).toBe(false);
    s = renameCollection(toggleInCollection(s, 'c1', 'h2'), 'c1', 'Cold season');
    expect(resolveCollection('c1', [book('h2'), book('h3')], s, NOW)!.books.map((b) => b.hash)).toEqual(['h2']);
    expect(resolveCollection('c1', [], s, NOW)!.name).toBe('Cold season');
    expect(deleteCollection(s, 'c1').collections).toEqual([]);
    expect(resolveCollection('nope', [], s, NOW)).toBe(null);
  });
});

describe('resolved collections and genres', () => {
  const lib: ShelfBook[] = [
    book('new-unread'),
    book('old-unread', { createdAt: new Date(2026, 7, 1).getTime() }),
    book('reading', { progress: [10, 100] }),
    book('done', { readingStatus: 'finished', tags: ['Sci-fi', ' Poetry '] }),
    book('gone', { deletedAt: 5, tags: ['Sci-fi'] }),
    book('sf', { tags: ['Sci-fi', 'Sci-fi'] }),
  ];

  it('automatic and favorite collections', () => {
    const s = toggleFavorite(emptyShelves(), 'done');
    expect(resolveCollection('auto:unread-month', lib, s, NOW)!.books.map((b) => b.hash)).toEqual(['new-unread', 'sf']);
    expect(resolveCollection('auto:unread', lib, s, NOW)!.books.map((b) => b.hash)).toEqual(['new-unread', 'old-unread', 'sf']);
    expect(resolveCollection('fav', lib, s, NOW)!.books.map((b) => b.hash)).toEqual(['done']);
    expect(listCollections(lib, s, NOW).map((c) => c.id)).toEqual(['auto:unread-month', 'auto:unread', 'fav']);
  });

  it('genres count each tag once per book, skip deleted, sort by count', () => {
    expect(genreRows(lib)).toEqual([
      { tag: 'Sci-fi', count: 2 },
      { tag: 'Poetry', count: 1 },
    ]);
    expect(resolveCollection('tag:Sci-fi', lib, emptyShelves(), NOW)!.books.map((b) => b.hash)).toEqual(['done', 'sf']);
  });
});

describe('saved words', () => {
  it('saves newest first, one per word ignoring case, and removes', () => {
    let s = saveWord(emptyShelves(), 'tide', 'The rise and fall of the sea', 1);
    s = saveWord(s, 'Brine', 'Very salty water', 2);
    s = saveWord(s, 'TIDE', 'updated', 3);
    expect(s.savedWords.map((w) => [w.word, w.note])).toEqual([['TIDE', 'updated'], ['Brine', 'Very salty water']]);
    expect(isWordSaved(s, ' tide ')).toBe(true);
    expect(saveWord(s, '  ', 'x', 4)).toBe(s);
    expect(removeWord(s, 'tide').savedWords.map((w) => w.word)).toEqual(['Brine']);
  });
});

describe('pinned books', () => {
  it('toggle, cap at three (oldest drops), and order pinned first', () => {
    let s = togglePin(emptyShelves(), 'a');
    s = togglePin(togglePin(togglePin(s, 'b'), 'c'), 'd');
    expect(s.pinned).toEqual(['b', 'c', 'd']);
    expect(isPinned(s, 'a')).toBe(false);
    expect(togglePin(s, 'c').pinned).toEqual(['b', 'd']);
    const books = ['x', 'd', 'y', 'b'].map((hash) => ({ hash }));
    expect(pinnedFirst(books, s.pinned).map((b) => b.hash)).toEqual(['b', 'd', 'x', 'y']);
    expect(pinnedFirst(books, []).map((b) => b.hash)).toEqual(['x', 'd', 'y', 'b']);
  });
});

describe('normalizeShelves', () => {
  it('repairs bad input and keeps good data', () => {
    expect(normalizeShelves(null)).toEqual(emptyShelves());
    const s = normalizeShelves({
      favorites: ['a', 'a', 3],
      ratings: { a: 5, b: 9, c: 'x', d: 2.4 },
      wishlist: [{ title: 'T', author: 'A', id: 'w', addedAt: 4 }, { title: '' }, null],
      collections: [{ id: 'c', name: 'N', hashes: ['h', 'h', 1] }, { id: '', name: 'bad' }],
      savedWords: [{ word: 'tide', note: 'n' }, { word: 'Tide' }, { word: '' }],
      pinned: ['a', 'a', 'b', 'c', 'd', 5],
    });
    expect(s.pinned).toEqual(['a', 'b', 'c']);
    expect(s.savedWords).toEqual([{ word: 'tide', note: 'n', addedAt: 0 }]);
    expect(s.favorites).toEqual(['a']);
    expect(s.ratings).toEqual({ a: 5, d: 2 });
    expect(s.wishlist).toHaveLength(1);
    expect(s.collections).toEqual([{ id: 'c', name: 'N', hashes: ['h'] }]);
  });
});
