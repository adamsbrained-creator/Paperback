// Paperback: cover colours for books that have no cover image, and the shape of the drawn cover.
// Pure helpers; the Cover component does the drawing.

/** [background, text] pairs from the Cover design. */
export const COVER_PALETTE: readonly (readonly [string, string])[] = [
  ['#1F3A5F', '#F6E7C8'],
  ['#F2D7D0', '#8F2D1B'],
  ['#161616', '#F2674A'],
  ['#E7D9C1', '#3A2E1C'],
  ['#6B1F2A', '#F3E2E2'],
  ['#2F6F8F', '#EAF4F8'],
  ['#2D4A3E', '#E6F0D8'],
  ['#4F7040', '#F7F3E6'],
];

/** The same book always gets the same colours. */
export function coverColors(key: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const [bg, fg] = COVER_PALETTE[h % COVER_PALETTE.length]!;
  return { bg, fg };
}

/** First letter of the title, ignoring "The", "A" and "An". */
export function coverInitial(title: string): string {
  const stripped = title.trim().replace(/^(the|a|an)\s+/i, '');
  return (Array.from(stripped)[0] ?? '?').toUpperCase();
}

/** Covers this wide or wider show the title and author; smaller ones show only the initial. */
export const FULL_COVER_MIN_WIDTH = 90;
export const showsFullCover = (width: number): boolean => width >= FULL_COVER_MIN_WIDTH;
