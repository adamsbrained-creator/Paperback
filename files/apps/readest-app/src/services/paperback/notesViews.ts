// Paperback: turn per-book booknotes into the rows the Notes / Bookmarks / Search screens show.
// Pure — no React, no I/O.

export interface RawNote {
  id: string;
  type: string; // 'bookmark' | 'annotation' | 'excerpt' | 'notebook'
  cfi: string;
  page?: number;
  text?: string;
  note?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export type NoteKind = 'highlight' | 'note' | 'bookmark';

export interface NoteRow {
  key: string;
  bookHash: string;
  bookTitle: string;
  kind: NoteKind;
  text: string; // the highlighted passage (or bookmark label)
  note: string; // the reader's own note ('' for plain highlights)
  color: string; // hex
  cfi: string;
  page?: number;
  at: number; // ms, last change
}

const PASTEL: Record<string, string> = {
  yellow: '#ffe066',
  red: '#ffb4b4',
  green: '#c8e6c4',
  blue: '#b9c4f2',
  violet: '#e0c6f7',
};

export const noteColorHex = (color?: string): string => {
  if (!color) return PASTEL['yellow']!;
  if (PASTEL[color]) return PASTEL[color]!;
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : PASTEL['yellow']!;
};

const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();

export function extractNotes(
  book: { hash: string; title: string },
  notes: RawNote[] | undefined,
): NoteRow[] {
  const rows: NoteRow[] = [];
  for (const n of notes ?? []) {
    if (n.deletedAt) continue;
    const text = clean(n.text);
    const note = clean(n.note);
    let kind: NoteKind;
    if (n.type === 'bookmark') kind = 'bookmark';
    else if (n.type === 'annotation' || n.type === 'excerpt') kind = note ? 'note' : 'highlight';
    else if (n.type === 'notebook' && note) kind = 'note';
    else continue;
    if (kind !== 'bookmark' && !text && !note) continue;
    rows.push({
      key: `${book.hash}:${n.id}`,
      bookHash: book.hash,
      bookTitle: book.title,
      kind,
      text,
      note,
      color: noteColorHex(n.color),
      cfi: n.cfi,
      page: n.page,
      at: n.updatedAt || n.createdAt || 0,
    });
  }
  return rows;
}

export const newestFirst = (rows: NoteRow[]): NoteRow[] => [...rows].sort((a, b) => b.at - a.at);

export type NoteFilter = 'all' | 'highlights' | 'notes';

export function filterNotes(rows: NoteRow[], filter: NoteFilter): NoteRow[] {
  const visible = rows.filter((r) => r.kind !== 'bookmark');
  if (filter === 'highlights') return visible.filter((r) => r.kind === 'highlight');
  if (filter === 'notes') return visible.filter((r) => r.kind === 'note');
  return visible;
}

export interface BookmarkGroup {
  bookHash: string;
  bookTitle: string;
  bookmarks: NoteRow[];
}

/** Bookmarks grouped by book, books ordered by their newest bookmark. */
export function groupBookmarks(rows: NoteRow[]): BookmarkGroup[] {
  const groups = new Map<string, BookmarkGroup>();
  for (const r of newestFirst(rows.filter((x) => x.kind === 'bookmark'))) {
    let g = groups.get(r.bookHash);
    if (!g) {
      g = { bookHash: r.bookHash, bookTitle: r.bookTitle, bookmarks: [] };
      groups.set(r.bookHash, g);
    }
    g.bookmarks.push(r);
  }
  return [...groups.values()];
}

const norm = (s: string) => s.toLowerCase();

export function searchBooks<T extends { title: string; author: string }>(books: T[], query: string): T[] {
  const q = norm(query.trim());
  if (!q) return [];
  return books.filter((b) => norm(b.title).includes(q) || norm(b.author || '').includes(q));
}

export function searchNotes(rows: NoteRow[], query: string): NoteRow[] {
  const q = norm(query.trim());
  if (!q) return [];
  return newestFirst(
    rows.filter((r) => r.kind !== 'bookmark' && (norm(r.text).includes(q) || norm(r.note).includes(q))),
  );
}

/** Split `text` around case-insensitive matches of `query` for highlighting in the UI. */
export function splitMatches(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const out: { text: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at < 0) {
      out.push({ text: text.slice(i), hit: false });
      break;
    }
    if (at > i) out.push({ text: text.slice(i, at), hit: false });
    out.push({ text: text.slice(at, at + needle.length), hit: true });
    i = at + needle.length;
  }
  return out;
}

/** A short excerpt of `text` around the first match, with ellipses. */
export function snippet(text: string, query: string, radius = 48): string {
  const at = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (at < 0 || text.length <= radius * 2) return text;
  const from = Math.max(0, at - radius);
  const to = Math.min(text.length, at + query.length + radius);
  return `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today" · "Yesterday" · "Sep 30" · "Sep 30, 2025" for a ms timestamp. */
export function dayLabel(ms: number, now: Date): string {
  const d = new Date(ms);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startToday) return 'Today';
  if (d.getTime() >= startToday - 864e5) return 'Yesterday';
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}
