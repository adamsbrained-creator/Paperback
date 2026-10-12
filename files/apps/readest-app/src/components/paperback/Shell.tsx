'use client';

import clsx from 'clsx';
import { useAppRouter } from '@/components/paperback/platform';
import { useTheme } from '@/components/paperback/platform';
import { useThemeStore } from '@/components/paperback/platform';
import { useState } from 'react';
import { HomeIcon, MenuLinesIcon } from './icons';
import MenuSheet from './MenuSheet';
import PageTop from './PageTop';
import TabBar, { Dock, HeaderSwitch, type TabId } from './TabBar';
import { useNavStyle } from './useNavStyle';

interface ShellProps {
  title: string;
  /** Replaces the default round Home button on the right of the header. */
  right?: React.ReactNode;
  /** Replaces the title text on the left (e.g. a pill button). */
  left?: React.ReactNode;
  /** Shows the bottom tab bar with this tab highlighted. */
  tab?: TabId;
  /** Replaces the whole header row (used by Home). */
  header?: React.ReactNode;
  /** Extra class on the content column (a screen can change its side padding). */
  wrapClassName?: string;
  /** Standard Paperback header (menu · "paperback" · search, `title` underneath, sized by Header size). */
  pageHeader?: boolean;
  children: React.ReactNode;
}

/** Common frame for the Paperback screens: theme, safe areas, header. */
export default function Shell({ title, left, right, tab, header, wrapClassName, pageHeader, children }: ShellProps) {
  const router = useAppRouter();
  const { isDarkMode, safeAreaInsets } = useThemeStore();
  useTheme({ systemUIVisible: true });
  const [navStyle] = useNavStyle();
  const [menuOpen, setMenuOpen] = useState(false);
  const top = safeAreaInsets?.top || 0;
  const bottom = safeAreaInsets?.bottom || 0;
  const bottomNav = tab && (navStyle === 'bar' || navStyle === 'dock' || navStyle === 'off');

  return (
    <div
      className={clsx('pb-root', isDarkMode && 'pb-dark')}
      style={{
        paddingTop: `${safeAreaInsets?.top || 0}px`,
        paddingBottom: navStyle === 'bar' && tab ? 0 : `${bottom}px`,
      }}
    >
      {/* The reader's close animation waits for an element with this class (Readest's library). */}
      <span className='bookshelf' hidden aria-hidden />
      {/* Opaque strip under the system status bar, so scrolled content never runs into its icons. */}
      <div className='pb-statusscrim' style={{ height: top }} />
      <div className={clsx('pb-wrap', bottomNav && 'pb-with-tabs', pageHeader && !header && 'pb-set-wrap', wrapClassName)}>
        {tab && navStyle === 'header' && <HeaderSwitch active={tab} />}
        {header ??
          (pageHeader ? (
            <PageTop label={title} />
          ) : (
            <header className='pb-head'>
              {left ?? <h1 className='pb-h1'>{title}</h1>}
              {right ?? (
                <button className='pb-round' aria-label='Home' onClick={() => router.push('/home')}>
                  <HomeIcon size={22} />
                </button>
              )}
            </header>
          ))}
        {children}
      </div>
      {tab && navStyle === 'bar' && <TabBar active={tab} bottomInset={bottom} />}
      {tab && navStyle === 'dock' && <Dock active={tab} bottomInset={bottom} />}
      {tab && navStyle === 'off' && (
        <>
          <button className='pb-fab' style={{ bottom: 22 + bottom }} aria-label='Menu' onClick={() => setMenuOpen(true)}>
            <MenuLinesIcon size={26} strokeWidth={2} />
          </button>
          <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
      )}
    </div>
  );
}
