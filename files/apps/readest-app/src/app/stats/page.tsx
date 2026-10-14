'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Shell from '@/components/paperback/Shell';
import { useStatsData } from './useStatsData';
import ActivityView from './components/ActivityView';
import GoalsView from './components/GoalsView';
import PlaceholderView from './components/PlaceholderView';
import SessionsScreen from './components/SessionsScreen';
import StatsNav, { STATS_PAGES, type StatsPage } from './components/StatsNav';
import { SIcon } from './components/StatsIcons';

// A page of Stats, or a screen opened from Activity (all sessions, reading goals).
type Screen = 'main' | 'sessions' | 'goals';

/**
 * ?tab=sessions | goals opens that screen; ?tab=milestones | books | insights opens that page.
 * Older links (the menu's "Reading history") use ?tab=history for the session list, which is now Activity → View sessions.
 */
function readUrl(): { screen: Screen; page: StatsPage } {
  const t = new URLSearchParams(window.location.search).get('tab');
  if (t === 'sessions' || t === 'history') return { screen: 'sessions', page: 'activity' };
  if (t === 'goals') return { screen: 'goals', page: 'activity' };
  const page = STATS_PAGES.find((p) => p.id === t)?.id ?? 'activity';
  return { screen: 'main', page };
}

const scroller = () => document.querySelector<HTMLElement>('.pb-root');

export default function StatsPage() {
  const [screen, setScreen] = useState<Screen>('main');
  const [page, setPage] = useState<StatsPage>('activity');
  const { events, error, now, library, booksByHash } = useStatsData();
  const scrollBefore = useRef(0);

  useEffect(() => {
    const sync = () => {
      const s = readUrl();
      setScreen(s.screen);
      if (s.screen === 'main') {
        requestAnimationFrame(() => {
          const el = scroller();
          if (el) el.scrollTop = scrollBefore.current;
        });
      }
    };
    const first = readUrl();
    setScreen(first.screen);
    setPage(first.page);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const open = useCallback((s: Exclude<Screen, 'main'>) => {
    scrollBefore.current = scroller()?.scrollTop ?? 0;
    window.history.pushState({ pbs: s }, '', `${window.location.pathname}?tab=${s}`);
    setScreen(s);
    const el = scroller();
    if (el) el.scrollTop = 0;
  }, []);

  // Back: undo the push when this screen was opened from Activity, else just show Activity.
  const close = useCallback(() => {
    if ((window.history.state as { pbs?: string } | null)?.pbs) {
      window.history.back();
    } else {
      window.history.replaceState({}, '', window.location.pathname);
      setScreen('main');
    }
  }, []);

  const header = (
    <div className='pbs pbs-top' style={{ height: 76, paddingTop: 4 }}>
      <h1>Stats</h1>
      <span className='pbs-chip'>
        <i className='pbs-dot' /> On this device
      </span>
    </div>
  );

  const ready = events !== null;
  const hasEvents = ready && events.length > 0;

  return (
    <Shell title='Stats' tab='stats' header={screen === 'main' ? header : <></>}>
      {error && (
        <div className='pb-card pb-pk'>
          Couldn&apos;t open the reading statistics database.
          <div className='pb-note'>{error}</div>
        </div>
      )}
      {!error && events === null && <div className='pb-empty'>Loading…</div>}

      {ready && (
        <>
          {/* Activity stays mounted while a screen is open on top of it, so its period and scroll are kept. */}
          <div className='pbs pbs-col' hidden={screen !== 'main'}>
            <StatsNav value={page} onChange={setPage} />
            {page === 'activity' ? (
              hasEvents ? (
                <ActivityView
                  events={events}
                  library={library}
                  booksByHash={booksByHash}
                  now={now}
                  onOpenSessions={() => open('sessions')}
                  onOpenGoals={() => open('goals')}
                />
              ) : (
                <div className='pbs-card pbs-note' style={{ margin: 0 }}>
                  Nothing tracked yet. Read a few pages and your stats will appear here.
                </div>
              )
            ) : (
              <PlaceholderView page={page} />
            )}
          </div>

          {screen === 'sessions' && <SessionsScreen events={events} booksByHash={booksByHash} onBack={close} />}
          {screen === 'goals' && (
            <div className='pbs pbs-col'>
              <div className='pbs-stop'>
                <button type='button' className='pbs-round' aria-label='Back to Activity' onClick={close}>
                  <SIcon name='back' />
                </button>
                <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500, letterSpacing: '-.02em' }}>Goals</h2>
              </div>
              <GoalsView events={events} library={library} now={now} />
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
