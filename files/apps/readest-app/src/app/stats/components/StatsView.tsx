'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { Book } from '@/types/book';
import {
  buildHeatmap,
  computeStreaks,
  computeSummary,
  formatCount,
  formatDuration,
  hourDistribution,
  rollingStats,
  secondsByDay,
  topBooks,
  type StatEventRow,
  type StatsRange,
} from '@/services/statistics/statsAggregate';
import { useShelves } from '@/components/paperback/useShelves';
import { averageRating } from '@/services/paperback/shelves';
import { todayTotals } from '@/services/paperback/libraryViews';
import { countFinishedSince } from '../useStatsData';
import { DEFAULT_GOALS, loadGoals } from '../goals';
import { Ring, Stat, Thumb } from './ui';

const RANGES: { id: StatsRange; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

interface Props {
  events: StatEventRow[];
  library: Book[];
  booksByHash: Map<string, Book>;
  now: Date;
  onOpenTab: (tab: 'goals' | 'history') => void;
}

export default function StatsView({ events, library, booksByHash, now, onOpenTab }: Props) {
  const [range, setRange] = useState<StatsRange>('week');
  const [shelves] = useShelves();
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  useEffect(() => setGoals(loadGoals()), []);

  const roll = useMemo(() => rollingStats(events, range, now), [events, range, now]);
  const inWindow = useMemo(() => {
    const from = Math.floor(roll.start.getTime() / 1000);
    return events.filter((e) => e.startTime >= from);
  }, [events, roll.start]);
  const summary = useMemo(() => computeSummary(inWindow), [inWindow]);
  const byDay = useMemo(() => secondsByDay(events), [events]);
  const streaks = useMemo(() => computeStreaks(byDay, now), [byDay, now]);
  const heat = useMemo(() => buildHeatmap(byDay, now, 18), [byDay, now]);
  const hours = useMemo(() => hourDistribution(inWindow), [inWindow]);
  const top = useMemo(() => topBooks(inWindow, 5), [inWindow]);
  const finished = useMemo(() => countFinishedSince(library, roll.start), [library, roll.start]);
  const today = useMemo(() => todayTotals(events, now), [events, now]);
  const avg = averageRating(shelves);

  const maxBar = Math.max(1, ...roll.bars.map((b) => b.seconds));
  const maxHour = Math.max(1, ...hours);
  const dense = roll.bars.length > 12;
  const todayMin = Math.round(today.seconds / 60);
  const goalPct = Math.min(1, today.seconds / 60 / goals.minutesPerDay);

  return (
    <div className='pb-stack'>
      <div className='pb-seg' role='tablist' aria-label='Period'>
        {RANGES.map((r) => (
          <button
            key={r.id}
            role='tab'
            aria-selected={range === r.id}
            className={clsx(range === r.id && 'on')}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div>
        <div className='pb-eyebrow' style={{ margin: '14px 0 2px' }}>
          Read · last {roll.windowLabel}
        </div>
        <div className='pb-hero pb-serif'>{roll.seconds ? formatDuration(roll.seconds) : '0m'}</div>
        {roll.deltaPct !== null && (
          <div className={clsx('pb-delta', roll.deltaPct < 0 && 'down')}>
            {roll.deltaPct >= 0 ? '+' : '−'}
            {Math.abs(roll.deltaPct)}% vs previous {roll.windowLabel}
          </div>
        )}
      </div>

      <div className='pb-card pb-chartcard'>
        <div className={dense ? 'pb-bars dense' : 'pb-bars'}>
          {roll.bars.map((b, i) => (
            <div
              key={i}
              className={b.isCurrent ? 'pb-bar current' : 'pb-bar'}
              style={{ height: `${Math.max(5, (b.seconds / maxBar) * 100)}%` }}
              title={`${formatDuration(b.seconds)} · ${b.pages} pages`}
            />
          ))}
        </div>
        <div className={dense ? 'pb-axis dense' : 'pb-axis'}>
          {roll.bars.map((b, i) => (
            <span key={i}>{b.label}</span>
          ))}
        </div>
      </div>

      <div className='pb-trio'>
        <div className='pb-card'>
          <div className='pb-trio-val'>
            {streaks.current} {streaks.current === 1 ? 'day' : 'days'}
          </div>
          <div className='pb-label'>Streak</div>
        </div>
        <div className='pb-card'>
          <div className='pb-trio-val'>{formatCount(roll.pages)}</div>
          <div className='pb-label'>Pages</div>
        </div>
        <div className='pb-card'>
          <div className='pb-trio-val'>{finished}</div>
          <div className='pb-label'>Finished</div>
        </div>
      </div>

      <div className='pb-card'>
        <div className='pb-ring-wrap'>
          <Ring value={goalPct} size={120} stroke={16}>
            <div className='pb-title'>{Math.round(goalPct * 100)}%</div>
          </Ring>
          <div>
            <div className='pb-title' style={{ fontSize: 20 }}>
              Daily goal
            </div>
            <div className='pb-label'>
              {todayMin} of {goals.minutesPerDay} min today
            </div>
          </div>
        </div>
      </div>

      <div className='pb-pills'>
        <button className='pb-pill' onClick={() => onOpenTab('goals')}>
          Reading goals
        </button>
        <button className='pb-pill' onClick={() => onOpenTab('history')}>
          Reading history
        </button>
      </div>

      <div className='pb-sec'>Details · last {roll.windowLabel}</div>
      <div className='pb-grid2'>
        <Stat label='Pace' value={summary.pagesPerHour ? `${summary.pagesPerHour} p/h` : '–'} />
        <Stat label='Avg session' value={summary.sessions ? formatDuration(summary.avgSessionSeconds) : '–'} />
        <Stat label='Sessions' value={String(summary.sessions)} />
        <Stat label='Longest streak' value={`${streaks.longest} ${streaks.longest === 1 ? 'day' : 'days'}`} />
        <Stat label='Avg rating' value={avg ? `${avg} ★` : '–'} />
        <Stat label='Rated books' value={String(Object.keys(shelves.ratings).length)} />
      </div>

      <div className='pb-card'>
        <div className='pb-label'>Reading rhythm · last 18 weeks</div>
        <div className='pb-heat'>
          {heat.map((col) =>
            col.map((c) => (
              <div
                key={c.key}
                className={`pb-cell l${c.level}${c.inFuture ? ' future' : ''}`}
                title={`${c.key}: ${formatDuration(c.seconds)}`}
              />
            )),
          )}
        </div>
      </div>

      <div className='pb-card'>
        <div className='pb-label'>When you read</div>
        <div className='pb-bars dense' style={{ height: 90 }}>
          {hours.map((s, h) => (
            <div
              key={h}
              className={s === maxHour && s > 0 ? 'pb-bar current' : 'pb-bar'}
              style={{ height: `${Math.max(5, (s / maxHour) * 100)}%` }}
              title={`${h}:00 · ${formatDuration(s)}`}
            />
          ))}
        </div>
        <div className='pb-axis dense'>
          {hours.map((_, h) => (
            <span key={h}>{h % 6 === 0 ? String(h) : ''}</span>
          ))}
        </div>
      </div>

      {top.length > 0 && <div className='pb-sec'>Most read</div>}
      {top.map((b) => (
        <div key={b.md5} className='pb-row'>
          <Thumb md5={b.md5} book={booksByHash.get(b.md5)} />
          <div className='pb-grow'>
            <div className='pb-title pb-ellipsis'>{b.title}</div>
            <div className='pb-label pb-ellipsis'>
              {b.authors ? `${b.authors} · ` : ''}
              {formatDuration(b.seconds)}
            </div>
          </div>
          <div className='pb-label'>{Math.round(b.share * 100)}%</div>
        </div>
      ))}

      <div className='pb-note'>
        Pages follow the reader&apos;s own pagination, so they shift a little when you change font size
        or margins. A page visit counts for at most 2 minutes, so a forgotten screen doesn&apos;t inflate your time.
      </div>
    </div>
  );
}
