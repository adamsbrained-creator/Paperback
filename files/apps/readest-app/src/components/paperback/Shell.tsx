'use client';

import clsx from 'clsx';
import { PiHouse } from 'react-icons/pi';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import TabBar, { type TabId } from './TabBar';

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
  children: React.ReactNode;
}

/** Common frame for the Paperback screens: theme, safe areas, header. */
export default function Shell({ title, left, right, tab, header, children }: ShellProps) {
  const router = useAppRouter();
  const { isDarkMode, safeAreaInsets } = useThemeStore();
  useTheme({ systemUIVisible: true });

  return (
    <div
      className={clsx('pb-root', isDarkMode && 'pb-dark')}
      style={{
        paddingTop: `${safeAreaInsets?.top || 0}px`,
        paddingBottom: tab ? 0 : `${safeAreaInsets?.bottom || 0}px`,
      }}
    >
      {/* The reader's close animation waits for an element with this class (Readest's library). */}
      <span className='bookshelf' hidden aria-hidden />
      <div className={clsx('pb-wrap', tab && 'pb-with-tabs')}>
        {header ?? (
        <header className='pb-head'>
          {left ?? <h1 className='pb-h1'>{title}</h1>}
          {right ?? (
            <button className='pb-round' aria-label='Home' onClick={() => router.push('/home')}>
              <PiHouse size={22} />
            </button>
          )}
        </header>
        )}
        {children}
      </div>
      {tab && <TabBar active={tab} bottomInset={safeAreaInsets?.bottom || 0} />}
    </div>
  );
}
