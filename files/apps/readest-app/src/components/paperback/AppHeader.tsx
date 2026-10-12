'use client';

import { useState } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import { MenuIcon, PlusIcon, SearchIcon } from './icons';
import { Wordmark } from './Logo';
import MenuSheet from './MenuSheet';

/** Menu button · wordmark · search (or add). Owns the menu sheet. */
export default function AppHeader({ right = 'search' }: { right?: 'search' | 'add' }) {
  const router = useAppRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className='pb-appbar'>
        <button className='pb-round' aria-label='Menu' onClick={() => setMenuOpen(true)}>
          <MenuIcon size={22} />
        </button>
        <Wordmark />
        {right === 'add' ? (
          <button className='pb-round' aria-label='Add books' onClick={() => router.push('/import')}>
            <PlusIcon size={22} />
          </button>
        ) : (
          <button className='pb-round' aria-label='Search' onClick={() => router.push('/search')}>
            <SearchIcon size={22} />
          </button>
        )}
      </div>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
