// Paperback's own library model.
//
// Screens work with `PBook` (Paperback's book), never with Readest's `Book`. Today the list is
// filled from Readest's library; it is also saved by Paperback itself, so Home and Library can
// show instantly on launch, before Readest has finished loading. The `source` field points back at
// the Readest object for the two things only Readest can do (draw the cover, open the reader).
// When Paperback gets its own reader, `source` goes away and the list is filled by its own importer.

export type PBookStatus = 'unread' | 'reading' | 'finished' | 'abandoned';

export interface PBook {
  hash: string; // unique id of the book file
  title: string;
  author: string;
  format: string; // "EPUB", "PDF", …
  language: string; // "" when unknown
  tags: string[];
  deletedAt?: number | null;
  readingStatus?: string | undefined; // PBookStatus when set
  readingStatusUpdatedAt?: number | undefined;
  createdAt: number; // ms
  updatedAt: number; // ms
  progress?: [number, number] | null; // [current page (1-based), total pages]
  /** The Readest object behind this book (not saved). */
  source?: unknown;
}

/** The part of Readest's `Book` that Paperback reads. Readest's own type fits it. */
export interface RawBook {
  hash: string;
  title: string;
  author: string;
  format: string;
  tags?: string[];
  primaryLanguage?: string;
  metadata?: { language?: string | string[] };
  deletedAt?: number | null;
  readingStatus?: string;
  readingStatusUpdatedAt?: number;
  createdAt: number;
  updatedAt: number;
  progress?: [number, number] | null;
}

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

export function toPBook(raw: RawBook): PBook {
  const metaLang = raw.metadata?.language;
  const language = raw.primaryLanguage || (Array.isArray(metaLang) ? metaLang[0] : metaLang) || '';
  return {
    hash: raw.hash,
    title: raw.title,
    author: raw.author || '',
    format: raw.format,
    language: text(language),
    tags: (raw.tags ?? []).map((t) => t.trim()).filter(Boolean),
    deletedAt: raw.deletedAt ?? null,
    readingStatus: raw.readingStatus,
    readingStatusUpdatedAt: raw.readingStatusUpdatedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    progress: raw.progress ?? null,
    source: raw,
  };
}

// ---- saved copy -----------------------------------------------------------------------------

interface SavedCatalog {
  version: 1;
  savedAt: number;
  books: Omit<PBook, 'source'>[];
}

export function serializeCatalog(books: PBook[], now: number): string {
  const saved: SavedCatalog = {
    version: 1,
    savedAt: now,
    books: books.map(({ source: _source, ...rest }) => rest),
  };
  return JSON.stringify(saved);
}

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** Reads the saved copy; anything unusable gives an empty list, bad entries are skipped. */
export function parseCatalog(textValue: string): PBook[] {
  let raw: unknown;
  try {
    raw = JSON.parse(textValue);
  } catch {
    return [];
  }
  if (!raw || typeof raw !== 'object' || (raw as SavedCatalog).version !== 1) return [];
  const list = (raw as SavedCatalog).books;
  if (!Array.isArray(list)) return [];
  const out: PBook[] = [];
  for (const b of list as unknown as Record<string, unknown>[]) {
    const hash = text(b?.['hash']);
    const title = text(b?.['title']);
    if (!hash || !title) continue;
    const p = b['progress'];
    out.push({
      hash,
      title,
      author: text(b['author']),
      format: text(b['format']),
      language: text(b['language']),
      tags: Array.isArray(b['tags']) ? (b['tags'] as unknown[]).filter((t): t is string => typeof t === 'string') : [],
      deletedAt: typeof b['deletedAt'] === 'number' ? b['deletedAt'] : null,
      readingStatus: typeof b['readingStatus'] === 'string' ? b['readingStatus'] : undefined,
      readingStatusUpdatedAt: typeof b['readingStatusUpdatedAt'] === 'number' ? b['readingStatusUpdatedAt'] : undefined,
      createdAt: num(b['createdAt']),
      updatedAt: num(b['updatedAt']),
      progress:
        Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
          ? [p[0], p[1]]
          : null,
    });
  }
  return out;
}
