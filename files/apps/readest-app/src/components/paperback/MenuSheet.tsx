'use client';

import { PiCaretRight } from 'react-icons/pi';
import { useAppRouter } from '@/components/paperback/platform';
import Sheet from './Sheet';

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

/** The menu button's page list (also the whole navigation when the tab bar is off). */
export default function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useAppRouter();
  return (
    <Sheet open={open} onClose={onClose} title='Menu'>
      {GROUPS.map((g) => (
        <div key={g.label} className='pb-stack' style={{ marginBottom: 14 }}>
          <div className='pb-sec'>{g.label}</div>
          {g.items.map((i) => (
            <button
              key={i.path}
              className='pb-row pb-rowbtn'
              onClick={() => {
                onClose();
                router.push(i.path);
              }}
            >
              <div className='pb-grow pb-title' style={{ paddingLeft: 6 }}>
                {i.name}
              </div>
              <PiCaretRight size={18} />
            </button>
          ))}
        </div>
      ))}
    </Sheet>
  );
}
