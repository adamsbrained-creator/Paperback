import type { CSSProperties } from 'react';

/**
 * Paperback icon set (from the Icon set design).
 * 24 px grid · 1.9 px stroke · round caps and joins.
 * Every icon is a single path, drawn with currentColor, so it follows the text color.
 *
 * Active state (`filled`): icons with a closed shape fill in (Home, Bookmark, Favorite,
 * Library's top layer); line-only icons get a heavier stroke instead.
 */

type Def = { d: string; solid?: string };

const DEFS = {
  home: { d: 'M4 11l8-7 8 7 M6 10v10h12V10', solid: 'M4 11l8-7 8 7 M6 10v10h12V10' },
  discover: { d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17z M15.5 8.5l-2 5-5 2 2-5z' },
  collections: { d: 'M4 8l8-4 8 4-8 4z M4 12l8 4 8-4 M4 16l8 4 8-4', solid: 'M4 8l8-4 8 4-8 4z' },
  bookmark: { d: 'M7 4h10v16l-5-4-5 4z', solid: 'M7 4h10v16l-5-4-5 4z' },
  dictionary: { d: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z M5 17a3 3 0 013-3h11' },
  stats: { d: 'M5 20v-8 M12 20V5 M19 20v-5' },
  settings: {
    d: 'M4 7h9 M17 7h3 M15 5a2 2 0 1 0 0 4 2 2 0 1 0 0-4z M4 17h3 M11 17h9 M9 15a2 2 0 1 0 0 4 2 2 0 1 0 0-4z',
  },
  contents: { d: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01' },
  theme: {
    d: 'M12 3a9 9 0 100 18c1.4 0 2-1 1.5-2.2-.5-1.2.2-2.3 1.5-2.3H17a4 4 0 004-4c0-5-4-9.5-9-9.5z M7.5 11h.01 M10 7h.01 M15 7.5h.01',
  },
  brightness: {
    d: 'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6L7 7 M17 17l1.4 1.4 M18.4 5.6L17 7 M7 17l-1.4 1.4',
  },
  listen: { d: 'M4 15v-3a8 8 0 0116 0v3 M4 15h3v5H5a1 1 0 01-1-1z M20 15h-3v5h2a1 1 0 001-1z' },
  search: { d: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 1 0 0-13z M16 16l4.5 4.5' },
  translate: {
    d: 'M4 6h9 M8.5 4v2 M6 10c1.2 2.6 3 4.2 5.5 5 M11 6c-.8 4-3 7-7 8.5 M12.5 20l3.8-9 3.8 9 M13.9 17h4.8',
  },
  highlight: { d: 'M14 4l6 6-8 8H6v-6z M4 21h6' },
  note: { d: 'M20 4c-6 0-11 4-12 11l-3 5 5-3c7-1 10-6 10-13z' },
  copy: { d: 'M9 9h10v11H9z M5 15V4h10' },
  appStyle: { d: 'M4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3z M4 10h16 M8 7h5' },
  goals: { d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17z M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z M12 12h.01' },
  backup: { d: 'M7 18a4 4 0 010-8 5 5 0 019.6-1A4.5 4.5 0 0117 18z M12 16v-5 M9.5 13.5L12 11l2.5 2.5' },
  about: { d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17z M12 11v5 M12 8h.01' },
  favorite: {
    d: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z',
    solid: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z',
  },
  // From the Settings design.
  menu: { d: 'M4 7h16 M4 12h10 M4 17h14' },
  menuLines: { d: 'M5 7h14 M5 12h14 M5 17h14' },
  close: { d: 'M6 6l12 12 M18 6L6 18' },
  dots: { d: 'M5 12h.01 M12 12h.01 M19 12h.01' },
  library: { d: 'M5 4v16 M10 4v16 M14 5.5l4.5 14' },
  reader: { d: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z M5 17a3 3 0 013-3h11' },
  // Not in the design file; drawn to the same grid and stroke so they sit with the set.
  plus: { d: 'M12 5v14 M5 12h14' },
  caretRight: { d: 'M9 5l7 7-7 7' },
} satisfies Record<string, Def>;

export type IconName = keyof typeof DEFS;

export interface IconProps {
  /** Pixel size (the icon is drawn on a 24 px grid and scaled). */
  size?: number;
  /** Active / selected look. */
  filled?: boolean;
  /** Overrides the 1.9 px stroke (the Settings chevrons and menu button use 2). */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

function make(name: IconName, label?: string) {
  const def: Def = DEFS[name];
  const Icon = ({ size = 24, filled = false, strokeWidth, className, style }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth ?? (filled && !def.solid ? 2.6 : 1.9)}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      style={style}
      aria-hidden='true'
      focusable='false'
    >
      {filled && def.solid && <path d={def.solid} fill='currentColor' />}
      <path d={def.d} />
    </svg>
  );
  Icon.displayName = label ?? `${name[0]!.toUpperCase()}${name.slice(1)}Icon`;
  return Icon;
}

export const HomeIcon = make('home');
export const DiscoverIcon = make('discover');
export const CollectionsIcon = make('collections');
export const BookmarkIcon = make('bookmark');
export const DictionaryIcon = make('dictionary');
export const StatsIcon = make('stats');
export const SettingsIcon = make('settings');
export const ContentsIcon = make('contents');
export const ThemeIcon = make('theme');
export const BrightnessIcon = make('brightness');
export const ListenIcon = make('listen');
export const SearchIcon = make('search');
export const TranslateIcon = make('translate');
export const HighlightIcon = make('highlight');
export const NoteIcon = make('note');
export const CopyIcon = make('copy');
export const AppStyleIcon = make('appStyle');
export const GoalsIcon = make('goals');
export const BackupIcon = make('backup');
export const AboutIcon = make('about');
export const FavoriteIcon = make('favorite');
export const MenuIcon = make('menu');
export const MenuLinesIcon = make('menuLines');
export const CloseIcon = make('close');
export const DotsIcon = make('dots');
export const LibraryIcon = make('library');
export const ReaderIcon = make('reader');
export const PlusIcon = make('plus');
export const CaretRightIcon = make('caretRight');
