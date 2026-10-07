// Paperback: backup file for Paperback's own data (shelves, ratings, wishlist, collections,
// saved words, goals). Pure — the page does the file reading and writing.

import { normalizeShelves, type Shelves } from './shelves';

export interface PaperbackBackup {
  app: 'paperback';
  version: 1;
  exportedAt: string; // ISO
  shelves: Shelves;
  goals: Record<string, unknown> | null;
}

export function buildBackup(
  shelves: Shelves,
  goals: Record<string, unknown> | null,
  now: Date,
): PaperbackBackup {
  return { app: 'paperback', version: 1, exportedAt: now.toISOString(), shelves, goals };
}

const pad = (n: number) => String(n).padStart(2, '0');

export const backupFilename = (now: Date): string =>
  `paperback-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;

export type ParsedBackup =
  | { ok: true; shelves: Shelves; goals: Record<string, unknown> | null; exportedAt: string }
  | { ok: false; error: string };

export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'This is not a Paperback backup.' };
  const r = raw as Record<string, unknown>;
  if (r['app'] !== 'paperback') return { ok: false, error: 'This is not a Paperback backup.' };
  if (r['version'] !== 1) return { ok: false, error: 'This backup was made by a newer version of Paperback.' };
  const goals =
    r['goals'] && typeof r['goals'] === 'object' ? (r['goals'] as Record<string, unknown>) : null;
  return {
    ok: true,
    shelves: normalizeShelves(r['shelves']),
    goals,
    exportedAt: typeof r['exportedAt'] === 'string' ? r['exportedAt'] : '',
  };
}

/** "2 favorites · 3 ratings · 1 wishlist · 2 collections · 4 saved words" */
export function describeShelves(s: Shelves): string {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [
    plural(s.favorites.length, 'favorite', 'favorites'),
    plural(Object.keys(s.ratings).length, 'rating', 'ratings'),
    plural(s.wishlist.length, 'wishlist book', 'wishlist books'),
    plural(s.collections.length, 'collection', 'collections'),
    plural(s.savedWords.length, 'saved word', 'saved words'),
  ].join(' · ');
}

/**
 * A short definition-like line from the text of a dictionary result: the first line that is long
 * enough to be a sentence and is not just the headword.
 */
export function definitionSnippet(text: string, word: string, max = 140): string {
  const w = word.trim().toLowerCase();
  for (const raw of text.split(/\n+/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 25 || line.toLowerCase() === w) continue;
    return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
  }
  return '';
}
