'use client';

import '@/styles/paperback.css';
import clsx from 'clsx';
import { useState } from 'react';
import MenuFab from './MenuFab';
import MenuSheet from './MenuSheet';
import PageHeader from './PageHeader';
import { useAppRouter, useThemeStore } from './platform';
import { useHeaderSize } from './useHeaderSize';

/**
 * Top of Discover (the catalog browser): the Paperback header with "Discover" under it, plus the
 * round menu button and its pop-up. Sits above the catalog toolbar. The browser page is Readest's,
 * outside the Paperback screens, so the shared theme colours come from `.pb-scope`.
 */
export default function PaperbackOpdsHeader() {
  const router = useAppRouter();
  const { isDarkMode } = useThemeStore();
  const [size] = useHeaderSize();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={clsx('pb-scope pb-opds-head', isDarkMode && 'pb-dark')}>
      <PageHeader
        label='Discover'
        size={size}
        onMenu={() => setMenuOpen(true)}
        onSearch={() => router.push('/search')}
      />
      <MenuFab onOpen={() => setMenuOpen(true)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
