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
