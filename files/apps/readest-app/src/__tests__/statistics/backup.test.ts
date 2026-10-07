import { describe, it, expect } from 'vitest';
import {
  backupFilename,
  buildBackup,
  definitionSnippet,
  describeShelves,
  parseBackup,
} from '@/services/paperback/backup';
import { addWish, emptyShelves, saveWord, setRating, toggleFavorite } from '@/services/paperback/shelves';

describe('backup', () => {
  const now = new Date(2026, 9, 8, 12, 0);

  it('round-trips shelves and goals', () => {
    let s = toggleFavorite(emptyShelves(), 'h1');
    s = setRating(s, 'h1', 5);
    s = addWish(s, 'Low Tide', 'A. Brandt', 'w1', 1);
    s = saveWord(s, 'tide', 'The rise and fall of the sea', 2);
    const text = JSON.stringify(buildBackup(s, { booksPerYear: 30 }, now));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.shelves).toEqual(s);
      expect(parsed.goals).toEqual({ booksPerYear: 30 });
      expect(parsed.exportedAt).toBe(now.toISOString());
    }
  });

  it('rejects junk with a readable reason', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'This file is not valid JSON.' });
    expect(parseBackup('{"app":"other"}').ok).toBe(false);
    expect(parseBackup('[1,2]').ok).toBe(false);
    expect(parseBackup('{"app":"paperback","version":2}')).toEqual({
      ok: false,
      error: 'This backup was made by a newer version of Paperback.',
    });
  });

  it('repairs a hand-edited file instead of crashing', () => {
    const parsed = parseBackup('{"app":"paperback","version":1,"shelves":{"favorites":"oops","ratings":{"a":99}}}');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.shelves).toEqual(emptyShelves());
  });

  it('filename and summary', () => {
    expect(backupFilename(now)).toBe('paperback-backup-2026-10-08.json');
    expect(describeShelves(toggleFavorite(emptyShelves(), 'a'))).toBe(
      '1 favorite · 0 ratings · 0 wishlist books · 0 collections · 0 saved words',
    );
  });

  it('definition snippet picks the first sentence-like line', () => {
    const text = 'tide\nnoun\nThe regular rising and falling of the sea, pulled by the moon and the sun.\nanother long enough line here';
    expect(definitionSnippet(text, 'tide')).toBe('The regular rising and falling of the sea, pulled by the moon and the sun.');
    expect(definitionSnippet('tide\nnoun', 'tide')).toBe('');
    expect(definitionSnippet('x'.repeat(200), 'w', 50)).toBe('x'.repeat(49) + '…');
  });
});
