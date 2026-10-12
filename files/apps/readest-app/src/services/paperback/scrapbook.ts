// Paperback → Scrapbook: what a book's note looks like when it is sent to the Scrapbook app.
// Scrapbook takes shared text and uses its first line as the title, so the book title goes first.
// Each text ends with an "Open in Paperback" link (Readest's own readest:// link, which Paperback opens
// in the reader, at the passage when there is one); Scrapbook shows it as a tappable link.

/** Percent-encodes a link part, including the brackets Scrapbook's [text](link) syntax would stop at. */
const enc = (s: string) => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');

/**
 * A link that opens a book in Paperback: `readest://book/{hash}`, or with a highlight / note id and its
 * location `readest://book/{hash}/annotation/{id}?cfi=...`. Same shapes Readest itself understands.
 */
export function paperbackLink(bookHash: string, noteId?: string, cfi?: string): string {
  const base = `readest://book/${enc(bookHash)}`;
  if (!noteId) return base;
  return `${base}/annotation/${enc(noteId)}${cfi ? `?cfi=${enc(cfi)}` : ''}`;
}

const linkLine = (link: string | undefined) => (link ? `[Open in Paperback](${link})` : '');

/** The text sent to Scrapbook for one book's note. Empty when there is no note to send. */
export function scrapbookText(book: { title: string; author?: string; hash?: string }, note: string): string {
  const body = note.trim();
  if (!body) return '';
  const title = book.title.trim() || 'Untitled book';
  const by = book.author?.trim();
  const parts = [title, body, by ? `— ${by}` : '', linkLine(book.hash ? paperbackLink(book.hash) : undefined)];
  return parts.filter(Boolean).join('\n\n');
}

/**
 * The text sent to Scrapbook for one highlight or note from a book. A plain highlight starts with a quote
 * mark, which Scrapbook files as a Quote; a note you wrote starts with your words (a normal scrap) and
 * the passage follows. Then come the source (author, book, page) and the Paperback link. Empty when there is nothing to send.
 */
export function scrapbookHighlight(
  row: {
    text: string;
    note: string;
    bookTitle: string;
    page?: number | undefined;
    bookHash?: string | undefined;
    key?: string | undefined;
    cfi?: string | undefined;
  },
  author?: string,
): string {
  const passage = row.text.trim().replace(/^[“"]+|[”"]+$/g, '').trim();
  const note = row.note.trim();
  if (!passage && !note) return '';
  const source = [author?.trim(), row.bookTitle.trim(), row.page ? `p. ${row.page}` : '']
    .filter(Boolean)
    .join(', ');
  // A row's key is "{bookHash}:{noteId}".
  const noteId = row.bookHash && row.key?.startsWith(`${row.bookHash}:`) ? row.key.slice(row.bookHash.length + 1) : '';
  const link = row.bookHash ? paperbackLink(row.bookHash, noteId || undefined, row.cfi) : undefined;
  const parts = [note, passage ? `“${passage}”` : '', source ? `— ${source}` : '', linkLine(link)];
  return parts.filter(Boolean).join('\n\n');
}
