'use client';

import { useState } from 'react';
import { PiList, PiMagnifyingGlass, PiPlus } from 'react-icons/pi';
import { useAppRouter } from '@/components/paperback/platform';
import MenuSheet from './MenuSheet';

/** Menu button · wordmark · search (or add). Owns the menu sheet. */
export default function AppHeader({ right = 'search' }: { right?: 'search' | 'add' }) {
  const router = useAppRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className='pb-appbar'>
        <button className='pb-round' aria-label='Menu' onClick={() => setMenuOpen(true)}>
          <PiList size={22} />
        </button>
        <div className='pb-wordmark'>paperback</div>
        {right === 'add' ? (
          <button className='pb-round' aria-label='Add books' onClick={() => router.push('/import')}>
            <PiPlus size={22} />
          </button>
        ) : (
          <button className='pb-round' aria-label='Search' onClick={() => router.push('/search')}>
            <PiMagnifyingGlass size={22} />
          </button>
        )}
      </div>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
