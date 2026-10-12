'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import MenuFab from './MenuFab';
import MenuSheet from './MenuSheet';
import PageHeader from './PageHeader';
import { useAppRouter } from './platform';
import { useHeaderSize } from './useHeaderSize';

/**
 * The standard top of a Paperback screen: menu button · "paperback" · search, then the screen's
 * name underneath, in the size chosen in Settings → App style → Header size. Also brings the round
 * menu button (bottom right) and its pop-up, the same as Settings. Screens get it with
 * `<Shell title='…' pageHeader>`; Home and Stats have their own headers. The Library uses it too (with the
 * book count as `chip`).
 */
export default function PageTop({ label, chip }: { label: string; chip?: string }) {
  const router = useAppRouter();
  const pathname = usePathname();
  const [size] = useHeaderSize();
  const [menuOpen, setMenuOpen] = useState(false);

  // On the Search screen itself the search button just puts the cursor in the field.
  const onSearch = () => {
    if (pathname === '/search') document.querySelector<HTMLInputElement>('.pb-search input')?.focus();
    else router.push('/search');
  };

  return (
    <>
      <div className='pb-pg-top'>
        <PageHeader label={label} chip={chip} size={size} onMenu={() => setMenuOpen(true)} onSearch={onSearch} />
      </div>
      <MenuFab onOpen={() => setMenuOpen(true)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
