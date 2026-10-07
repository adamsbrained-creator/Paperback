'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/paperback/Shell';
import { useStatsData } from './useStatsData';
import { Pills } from './components/ui';
import StatsView from './components/StatsView';
import GoalsView from './components/GoalsView';
import HistoryView from './components/HistoryView';

type Tab = 'stats' | 'goals' | 'history';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stats', label: 'Stats' },
  { id: 'goals', label: 'Goals' },
  { id: 'history', label: 'History' },
];
const TITLES: Record<Tab, string> = { stats: 'Stats', goals: 'Goals', history: 'History' };

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>('stats');
  // Home and the menu deep-link here with ?tab=goals|history.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'goals' || t === 'history') setTab(t);
  }, []);
  const { events, error, now, library, booksByHash } = useStatsData();

  const header = (
    <div className='pb-statshead'>
      <h1 className='pb-bigtitle pb-serif'>{TITLES[tab]}</h1>
      <span className='pb-chip'>
        <i className='pb-dot' /> On this device
      </span>
    </div>
  );

  return (
    <Shell title={TITLES[tab]} tab='stats' header={header}>
      <div className='pb-stack'>
        {tab !== 'stats' && <Pills options={TABS} value={tab} onChange={setTab} />}

        {error && (
          <div className='pb-card pb-pk'>
            Couldn&apos;t open the reading statistics database.
            <div className='pb-note'>{error}</div>
          </div>
        )}
        {!error && events === null && <div className='pb-empty'>Loading…</div>}
        {events !== null && events.length === 0 && tab !== 'goals' && (
          <div className='pb-card pb-empty'>
            Nothing tracked yet. Read a few pages and your stats will appear here.
          </div>
        )}
        {events !== null && (
          <>
            {tab === 'stats' && events.length > 0 && (
              <StatsView
                events={events}
                library={library}
                booksByHash={booksByHash}
                now={now}
                onOpenTab={setTab}
              />
            )}
            {tab === 'goals' && <GoalsView events={events} library={library} now={now} />}
            {tab === 'history' && events.length > 0 && <HistoryView events={events} now={now} />}
          </>
        )}
      </div>
    </Shell>
  );
}
