'use client';

import clsx from 'clsx';
import Shell from '@/components/paperback/Shell';
import { useThemeStore } from '@/store/themeStore';

export default function AppearancePage() {
  const { themeMode, setThemeMode } = useThemeStore();
  const mode = themeMode === 'ambient' ? 'auto' : themeMode;

  return (
    <Shell title='Themes'>
      <div className='pb-stack'>
        <div className='pb-grid2'>
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              className={clsx('pb-theme', m === 'dark' && 'dark', mode === m && 'on')}
              onClick={() => setThemeMode(m)}
              aria-pressed={mode === m}
            >
              <span className='pb-theme-line a' />
              <span className='pb-theme-line b' />
              <span className='pb-theme-line c' />
              <span className='pb-theme-name'>{m === 'light' ? 'Light' : 'Dark'}</span>
            </button>
          ))}
        </div>
        <div className='pb-pills'>
          <button className={clsx('pb-pill', mode === 'auto' && 'on')} onClick={() => setThemeMode('auto')}>
            Match system
          </button>
        </div>
        <div className='pb-note'>
          Reader font, size, spacing, margins and page colors are set inside a book (tap the screen,
          then <b>Aa</b>) and are remembered per book or for all books.
        </div>
      </div>
    </Shell>
  );
}
