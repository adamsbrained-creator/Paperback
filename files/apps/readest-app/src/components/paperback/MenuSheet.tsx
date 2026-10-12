'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CaretRightIcon,
  CloseIcon,
  CollectionsIcon,
  DictionaryIcon,
  DiscoverIcon,
  DotsIcon,
  HomeIcon,
  SettingsIcon,
  StatsIcon,
  BookmarkIcon,
} from './icons';
import { useAppRouter, useThemeStore } from '@/components/paperback/platform';
import Sheet from './Sheet';

interface MainItem {
  name: string;
  path: string;
  Icon: React.ComponentType<{ size?: number }>;
  /** Pages that count as "being in" this item (the row is highlighted on them). */
  also?: string[];
  /** Home and Stats swap in place (like the tab bar); the rest are pushed so Back returns. */
  replace?: boolean;
}

// The menu from the design: seven destinations.
const MAIN: MainItem[] = [
  { name: 'Home', path: '/home', Icon: HomeIcon, replace: true },
  { name: 'Discover', path: '/discover', Icon: DiscoverIcon, also: ['/opds'] },
  { name: 'Collections', path: '/collections', Icon: CollectionsIcon, also: ['/collection'] },
  { name: 'Bookmarks', path: '/bookmarks', Icon: BookmarkIcon },
  { name: 'Dictionary', path: '/dictionary', Icon: DictionaryIcon },
  { name: 'Stats', path: '/stats', Icon: StatsIcon, replace: true },
  {
    name: 'Settings',
    path: '/settings',
    Icon: SettingsIcon,
    also: ['/appearance', '/app-style', '/about', '/backup', '/import'],
  },
];

// Not in the design: Paperback's other pages, which would otherwise have no way in.
// Delete the "More" row (SHOW_MORE) once these have a home in the redesigned screens.
const SHOW_MORE = true;
const GROUPS: { label: string; items: { name: string; path: string }[] }[] = [
  {
    label: 'Reading',
    items: [
      { name: 'Currently reading', path: '/reading' },
      { name: 'Recently read', path: '/recent' },
      { name: 'Finished', path: '/finished' },
      { name: 'Authors', path: '/authors' },
    ],
  },
  {
    label: 'Your notes',
    items: [
      { name: 'Notes & highlights', path: '/notes' },
      { name: 'Bookmarks', path: '/bookmarks' },
      { name: 'Search', path: '/search' },
      { name: 'Dictionary', path: '/dictionary' },
    ],
  },
  {
    label: 'Shelves',
    items: [
      { name: 'Favorites', path: '/favorites' },
      { name: 'Wishlist', path: '/wishlist' },
      { name: 'Collections', path: '/collections' },
      { name: 'Genres', path: '/genres' },
    ],
  },
  {
    label: 'Get books',
    items: [
      { name: 'Discover', path: '/discover' },
      { name: 'Import', path: '/import' },
    ],
  },
  {
    label: 'App',
    items: [
      { name: 'Reading history', path: '/stats?tab=history' },
      { name: 'Settings', path: '/settings' },
      { name: 'Backup & restore', path: '/backup' },
      { name: 'About', path: '/about' },
    ],
  },
];

const clean = (p: string | null) => (p ? p.replace(/\/+$/, '') || '/' : '');
const isIn = (current: string, item: MainItem) =>
  [item.path, ...(item.also ?? [])].some((p) => current === p || current.startsWith(`${p}/`));

/**
 * The menu button's pop-up: a card above the round menu button, over a dimmed screen. The button
 * turns into a close button while it is open. Also the whole navigation when the tab bar is off.
 */
export default function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useAppRouter();
  const current = clean(usePathname());
  const { safeAreaInsets } = useThemeStore();
  const bottom = safeAreaInsets?.bottom || 0;
  const [allOpen, setAllOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (item: MainItem) => {
    onClose();
    if (isIn(current, item) && current === item.path) return;
    if (item.replace) router.replace(item.path);
    else router.push(item.path);
  };

  return (
    <>
      {open && (
        <>
          <div className='pb-menu-scrim' onClick={onClose} />
          <nav className='pb-menu' aria-label='Main menu' style={{ bottom: 100 + bottom }}>
            {MAIN.map((item) => {
              const on = isIn(current, item);
              return (
                <button
                  key={item.path}
                  className={clsx('pb-menu-item', on && 'on')}
                  aria-current={on ? 'page' : undefined}
                  onClick={() => go(item)}
                >
                  <item.Icon size={22} />
                  <span className='pb-menu-name'>{item.name}</span>
                  {on && <span className='pb-menu-dot' />}
                </button>
              );
            })}
            {SHOW_MORE && (
              <button
                className='pb-menu-item'
                onClick={() => {
                  onClose();
                  setAllOpen(true);
                }}
              >
                <DotsIcon size={22} />
                <span className='pb-menu-name'>More</span>
              </button>
            )}
          </nav>
          <button
            className='pb-set-fab pb-menu-close'
            style={{ bottom: 24 + bottom }}
            aria-label='Close menu'
            onClick={onClose}
          >
            <CloseIcon size={24} strokeWidth={2} />
          </button>
        </>
      )}

      <Sheet open={allOpen} onClose={() => setAllOpen(false)} title='All pages'>
        {GROUPS.map((g) => (
          <div key={g.label} className='pb-stack' style={{ marginBottom: 14 }}>
            <div className='pb-sec'>{g.label}</div>
            {g.items.map((i) => (
              <button
                key={i.path}
                className='pb-row pb-rowbtn'
                onClick={() => {
                  setAllOpen(false);
                  router.push(i.path);
                }}
              >
                <div className='pb-grow pb-title' style={{ paddingLeft: 6 }}>
                  {i.name}
                </div>
                <CaretRightIcon size={18} />
              </button>
            ))}
          </div>
        ))}
      </Sheet>
    </>
  );
}
