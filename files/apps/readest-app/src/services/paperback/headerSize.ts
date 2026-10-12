// Paperback: how much room the top bar takes (App style → Header size).
// Pure helpers; the UI keeps the choice in local storage.

export type HeaderSize = 'compact' | 'regular' | 'large';

export const HEADER_SIZES: { id: HeaderSize; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'regular', label: 'Regular' },
  { id: 'large', label: 'Large' },
];

export const DEFAULT_HEADER_SIZE: HeaderSize = 'regular';

/** Anything stored that is not a known size falls back to the default. */
export function parseHeaderSize(value: unknown): HeaderSize {
  return HEADER_SIZES.some((s) => s.id === value) ? (value as HeaderSize) : DEFAULT_HEADER_SIZE;
}

export const headerSizeLabel = (size: HeaderSize): string =>
  HEADER_SIZES.find((s) => s.id === size)?.label ?? 'Regular';
