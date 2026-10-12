import { describe, it, expect } from 'vitest';
import { parseAnnotationDeepLink, parseBookDeepLink } from '@/utils/deeplink';
import { paperbackLink, scrapbookHighlight, scrapbookText } from '@/services/paperback/scrapbook';

describe('scrapbookText', () => {
  it('puts the book title first (Scrapbook uses the first line as the title), then the note, then the author', () => {
    expect(scrapbookText({ title: 'Dune', author: 'Frank Herbert' }, 'Fear is the mind-killer.')).toBe(
      'Dune\n\nFear is the mind-killer.\n\n— Frank Herbert',
    );
  });

  it('leaves out the author line when there is no author', () => {
    expect(scrapbookText({ title: 'Dune', author: '  ' }, 'A note')).toBe('Dune\n\nA note');
    expect(scrapbookText({ title: 'Dune' }, 'A note')).toBe('Dune\n\nA note');
  });

  it('sends nothing for an empty or blank note', () => {
    expect(scrapbookText({ title: 'Dune', author: 'Frank Herbert' }, '')).toBe('');
    expect(scrapbookText({ title: 'Dune' }, '  \n ')).toBe('');
  });

  it('trims the note and names an untitled book', () => {
    expect(scrapbookText({ title: ' ' }, '  hello \n')).toBe('Untitled book\n\nhello');
  });
});

describe('scrapbookHighlight', () => {
  it('sends a plain highlight as a quote with its source (starts with a quote mark so Scrapbook files it as a Quote)', () => {
    const out = scrapbookHighlight({ text: 'Fear is the mind-killer.', note: '', bookTitle: 'Dune', page: 12 }, 'Frank Herbert');
    expect(out).toBe('“Fear is the mind-killer.”\n\n— Frank Herbert, Dune, p. 12');
    expect(out.startsWith('“')).toBe(true);
  });

  it('puts your own note first, then the passage, then the source', () => {
    expect(scrapbookHighlight({ text: 'A passage', note: 'Why this matters', bookTitle: 'Dune' })).toBe(
      'Why this matters\n\n“A passage”\n\n— Dune',
    );
  });

  it('does not double the quote marks and leaves out missing parts', () => {
    expect(scrapbookHighlight({ text: '“Quoted”', note: '', bookTitle: 'Dune' })).toBe('“Quoted”\n\n— Dune');
    expect(scrapbookHighlight({ text: '', note: 'Only a note', bookTitle: '' })).toBe('Only a note');
  });

  it('sends nothing when there is no text and no note', () => {
    expect(scrapbookHighlight({ text: ' ', note: '', bookTitle: 'Dune' })).toBe('');
  });
});

describe('links back to Paperback', () => {
  const CFI = 'epubcfi(/6/14!/4/2/1:0)';

  it('builds a book link and an annotation link that Readest itself understands', () => {
    expect(parseBookDeepLink(paperbackLink('abc123'))).toEqual({ bookHash: 'abc123' });
    expect(parseAnnotationDeepLink(paperbackLink('abc123', 'note-9', CFI))).toEqual({
      bookHash: 'abc123',
      noteId: 'note-9',
      cfi: CFI,
    });
  });

  it('keeps brackets out of the link, so Scrapbook\'s [text](link) syntax does not end early', () => {
    const link = paperbackLink('abc123', 'n1', CFI);
    expect(link).not.toMatch(/[()]/);
    expect(link).toContain('%28');
  });

  it('ends a highlight with an Open in Paperback link to that passage', () => {
    const out = scrapbookHighlight(
      { text: 'A passage', note: '', bookTitle: 'Dune', page: 3, bookHash: 'abc123', key: 'abc123:n1', cfi: CFI },
      'Frank Herbert',
    );
    expect(out).toBe(
      `“A passage”\n\n— Frank Herbert, Dune, p. 3\n\n[Open in Paperback](${paperbackLink('abc123', 'n1', CFI)})`,
    );
  });

  it('falls back to the book link when the note has no id', () => {
    const out = scrapbookHighlight({ text: 'x', note: '', bookTitle: 'Dune', bookHash: 'abc123' });
    expect(out.endsWith('[Open in Paperback](readest://book/abc123)')).toBe(true);
  });

  it('ends a Journal note with a link to the book', () => {
    expect(scrapbookText({ title: 'Dune', author: 'Frank Herbert', hash: 'abc123' }, 'A note')).toBe(
      'Dune\n\nA note\n\n— Frank Herbert\n\n[Open in Paperback](readest://book/abc123)',
    );
  });
});
