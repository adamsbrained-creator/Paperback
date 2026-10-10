// Paperback: which navigation style the main screens (Home, Library, Stats) use.
// Pure helpers; the UI keeps the choice in local storage.

export type NavStyle = 'bar' | 'dock' | 'header' | 'off';

export const NAV_STYLES: { id: NavStyle; label: string; note: string }[] = [
  { id: 'bar', label: 'Tab bar', note: 'Flat, labelled, always visible' },
  { id: 'dock', label: 'Dock', note: 'Floating, only the active tab shows its label' },
  { id: 'header', label: 'Header switch', note: 'Lives in the top bar, frees the bottom' },
  { id: 'off', label: 'Off', note: 'No bar; the menu button opens pages' },
];

export const DEFAULT_NAV_STYLE: NavStyle = 'bar';

/** Anything stored that is not a known style falls back to the default. */
export function parseNavStyle(value: unknown): NavStyle {
  return NAV_STYLES.some((s) => s.id === value) ? (value as NavStyle) : DEFAULT_NAV_STYLE;
}

// ---- Home layout -------------------------------------------------------------------------

export type HomeStyle = 'classic' | 'pile';

export const HOME_STYLES: { id: HomeStyle; label: string; note: string }[] = [
  { id: 'classic', label: 'Classic', note: 'Continue reading, pinned books, today and streak' },
  { id: 'pile', label: 'Pile', note: 'A pile of your covers, your latest note, and shelves' },
];

export const DEFAULT_HOME_STYLE: HomeStyle = 'classic';

export function parseHomeStyle(value: unknown): HomeStyle {
  return HOME_STYLES.some((s) => s.id === value) ? (value as HomeStyle) : DEFAULT_HOME_STYLE;
}
