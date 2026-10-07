'use client';

import clsx from 'clsx';
import { PiBooks, PiBooksFill, PiChartBar, PiChartBarFill, PiHouse, PiHouseFill } from 'react-icons/pi';
import { useAppRouter } from '@/hooks/useAppRouter';

export type TabId = 'home' | 'library' | 'stats';

const TABS = [
  { id: 'home', label: 'Home', path: '/home', Off: PiHouse, On: PiHouseFill },
  { id: 'library', label: 'Library', path: '/books', Off: PiBooks, On: PiBooksFill },
  { id: 'stats', label: 'Stats', path: '/stats', Off: PiChartBar, On: PiChartBarFill },
] as const;

/** Flat, labelled bottom tab bar (option 1 in the navigation mockups). */
export default function TabBar({ active, bottomInset = 0 }: { active: TabId; bottomInset?: number }) {
  const router = useAppRouter();
  return (
    <nav className='pb-tabbar' style={{ paddingBottom: 8 + bottomInset }} aria-label='Main'>
      {TABS.map((t) => {
        const on = t.id === active;
        const Icon = on ? t.On : t.Off;
        return (
          <button
            key={t.id}
            className={clsx('pb-tab', on && 'on')}
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              if (on) return;
              // Home and Stats swap in place; Library is pushed so Back returns here.
              if (t.id === 'library') router.push(t.path);
              else router.replace(t.path);
            }}
          >
            <Icon size={26} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
