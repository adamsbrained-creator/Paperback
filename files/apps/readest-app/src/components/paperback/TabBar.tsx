'use client';

import clsx from 'clsx';
import { PiBooks, PiBooksFill, PiChartBar, PiChartBarFill, PiHouse, PiHouseFill } from 'react-icons/pi';
import { useAppRouter } from '@/components/paperback/platform';

export type TabId = 'home' | 'library' | 'stats';

const TABS = [
  { id: 'home', label: 'Home', path: '/home', Off: PiHouse, On: PiHouseFill },
  { id: 'library', label: 'Library', path: '/books', Off: PiBooks, On: PiBooksFill },
  { id: 'stats', label: 'Stats', path: '/stats', Off: PiChartBar, On: PiChartBarFill },
] as const;

function useGo() {
  const router = useAppRouter();
  // Home and Stats swap in place; Library is pushed so Back returns to where you were.
  return (id: TabId, path: string) => (id === 'library' ? router.push(path) : router.replace(path));
}

/** Option 1: flat, labelled bottom tab bar. */
export default function TabBar({ active, bottomInset = 0 }: { active: TabId; bottomInset?: number }) {
  const go = useGo();
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
            onClick={() => !on && go(t.id, t.path)}
          >
            <Icon size={26} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Option 2: floating dock; only the active tab shows its label. */
export function Dock({ active, bottomInset = 0 }: { active: TabId; bottomInset?: number }) {
  const go = useGo();
  return (
    <nav className='pb-dock' style={{ bottom: 18 + bottomInset }} aria-label='Main'>
      {TABS.map((t) => {
        const on = t.id === active;
        const Icon = on ? t.On : t.Off;
        return (
          <button
            key={t.id}
            className={clsx('pb-dock-item', on && 'on')}
            aria-label={t.label}
            aria-current={on ? 'page' : undefined}
            onClick={() => !on && go(t.id, t.path)}
          >
            <Icon size={26} />
            {on && <span>{t.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/** Option 3: a switch in the top bar. */
export function HeaderSwitch({ active }: { active: TabId }) {
  const go = useGo();
  return (
    <nav className='pb-hswitch' aria-label='Main'>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={clsx(t.id === active && 'on')}
          aria-current={t.id === active ? 'page' : undefined}
          onClick={() => t.id !== active && go(t.id, t.path)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
