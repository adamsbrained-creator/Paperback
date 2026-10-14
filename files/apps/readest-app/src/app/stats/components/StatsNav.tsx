'use client';

import { SIcon, type StatsIconName } from './StatsIcons';

export type StatsPage = 'activity' | 'milestones' | 'books' | 'history' | 'insights';

export const STATS_PAGES: { id: StatsPage; label: string; icon: StatsIconName }[] = [
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'milestones', label: 'Milestones', icon: 'trophy' },
  { id: 'books', label: 'Books', icon: 'book' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'insights', label: 'Insights', icon: 'spark' },
];

/** The five pages of Stats: the open one shows its name, the others are icons. */
export default function StatsNav({ value, onChange }: { value: StatsPage; onChange: (p: StatsPage) => void }) {
  return (
    <nav className='pbs-tabs' aria-label='Stats pages'>
      {STATS_PAGES.map((p) => {
        const on = p.id === value;
        return (
          <button
            key={p.id}
            type='button'
            className='pbs-tab'
            aria-current={on ? 'page' : undefined}
            aria-label={on ? undefined : p.label}
            onClick={() => !on && onChange(p.id)}
          >
            <SIcon name={p.icon} />
            {on && p.label}
          </button>
        );
      })}
    </nav>
  );
}
