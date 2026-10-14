'use client';

import { useMemo, useState } from 'react';
import type { PBook } from '@/services/paperback/library';
import {
  monthsOfYear,
  sessionPagesText,
  sessionStamp,
  sessionYears,
} from '@/services/statistics/activityStats';
import { formatCount, type StatEventRow } from '@/services/statistics/statsAggregate';
import { SIcon } from './StatsIcons';
import { Thumb } from './ui';

const FIRST = 5; // sessions shown when a month opens
const MORE = 25; // sessions added by each "more"

/** Every reading session, by year and month (opened from Activity → View sessions). */
export default function SessionsScreen({
  events,
  booksByHash,
  onBack,
}: {
  events: StatEventRow[];
  booksByHash: Map<string, PBook>;
  onBack: () => void;
}) {
  const years = useMemo(() => sessionYears(events), [events]);
  const [year, setYear] = useState<number | null>(null);
  const shown = year ?? years[0] ?? new Date().getFullYear();
  const months = useMemo(() => monthsOfYear(events, shown), [events, shown]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});

  const yi = years.indexOf(shown);
  // The newest month starts open; a month the person closed stays closed.
  const isOpen = (key: string, first: boolean) => (open.has(`!${key}`) ? false : first || open.has(key));
  const toggle = (key: string, first: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      const wasOpen = isOpen(key, first);
      next.delete(key);
      next.delete(`!${key}`);
      next.add(wasOpen ? `!${key}` : key);
      return next;
    });

  return (
    <div className='pbs pbs-col'>
      <div className='pbs-stop'>
        <button type='button' className='pbs-round' aria-label='Back to Activity' onClick={onBack}>
          <SIcon name='back' />
        </button>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500, letterSpacing: '-.02em' }}>{shown}</h2>
        {years.length > 1 && (
          <div className='pbs-yearnav'>
            <button
              type='button'
              className='pbs-round'
              aria-label='Earlier year'
              disabled={yi >= years.length - 1}
              onClick={() => setYear(years[yi + 1]!)}
            >
              <SIcon name='cl' />
            </button>
            <button
              type='button'
              className='pbs-round'
              aria-label='Later year'
              disabled={yi <= 0}
              onClick={() => setYear(years[yi - 1]!)}
            >
              <SIcon name='cr' />
            </button>
          </div>
        )}
      </div>

      {months.length === 0 && <div className='pbs-card pbs-note'>No reading sessions yet.</div>}
      <div className='pbs-months'>
        {months.map((m, idx) => {
          const key = `${shown}-${m.month}`;
          const expanded = isOpen(key, idx === 0);
          const visible = counts[key] ?? FIRST;
          const rest = m.sessions.length - visible;
          return (
            <section key={key} className='pbs-month'>
              <button
                type='button'
                className='pbs-m-head'
                aria-expanded={expanded}
                onClick={() => toggle(key, idx === 0)}
              >
                <div className='pbs-mt'>
                  <div className='pbs-mn'>{m.name}</div>
                  <div className='pbs-mp'>{formatCount(m.pages)} pages read</div>
                </div>
                <span className='pbs-badge'>{m.sessions.length}</span>
                <SIcon name='cd' />
              </button>
              {expanded && (
                <div className='pbs-m-body'>
                  {m.sessions.slice(0, visible).map((s) => (
                    <div key={`${s.md5}-${s.start}`} className='pbs-ent'>
                      <Thumb md5={s.md5} book={booksByHash.get(s.md5)} />
                      <div>
                        <h4>{s.title}</h4>
                        <p>{sessionPagesText(s)}</p>
                      </div>
                      <time>{sessionStamp(s)}</time>
                    </div>
                  ))}
                  {rest > 0 && (
                    <button
                      type='button'
                      className='pbs-more'
                      onClick={() => setCounts((c) => ({ ...c, [key]: visible + MORE }))}
                    >
                      {rest} more session{rest > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
