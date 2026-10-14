'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { PBook } from '@/services/paperback/library';
import {
  buildHeatmap,
  computeStreaks,
  dayKeyOf,
  formatCount,
  secondsByDay,
  topBooks,
  type StatEventRow,
} from '@/services/statistics/statsAggregate';
import {
  computeDetails,
  currentAnchor,
  dateLabel,
  firstReadingYear,
  goalWeek,
  pctDelta,
  periodData,
  periodInfo,
  sessionWhen,
  shiftAnchor,
  type Anchor,
  type Details,
  type Period,
  type PeriodData,
} from '@/services/statistics/activityStats';
import { countFinishedBetween } from '../useStatsData';
import { DEFAULT_GOALS, loadGoals } from '../goals';
import PatternsCard from './PatternsCard';
import PeriodDialog from './PeriodDialog';
import { SIcon } from './StatsIcons';
import { Thumb } from './ui';

type Metric = 'time' | 'pages';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly' },
  { id: 'all', label: 'All time' },
];

/** Height in px of the chart area (the bars and the goal line are placed inside it). */
const AXIS = 150;

function BigTime({ seconds }: { seconds: number }) {
  const min = Math.round(seconds / 60);
  if (min >= 60) {
    return (
      <>
        <span>{Math.floor(min / 60)}</span>
        <span className='pbs-u'>h</span>
        <span>{min % 60}</span>
        <span className='pbs-u'>m</span>
      </>
    );
  }
  return (
    <>
      <span>{min}</span>
      <span className='pbs-u'>m</span>
    </>
  );
}

/** 1h 07m with small units, for the detail tiles. */
function SmallTime({ seconds }: { seconds: number }) {
  const min = Math.round(seconds / 60);
  if (min >= 60) {
    const m = min % 60;
    return (
      <>
        {Math.floor(min / 60)}
        <small>h</small> {m < 10 ? `0${m}` : m}
        <small>m</small>
      </>
    );
  }
  return (
    <>
      {min}
      <small>m</small>
    </>
  );
}

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

interface Props {
  events: StatEventRow[];
  library: PBook[];
  booksByHash: Map<string, PBook>;
  now: Date;
  onOpenSessions: () => void;
  onOpenGoals: () => void;
}

/** Stats → Activity: hero chart, highlights, daily goal, details, rhythm, patterns, most read. */
export default function ActivityView({ events, library, booksByHash, now, onOpenSessions, onOpenGoals }: Props) {
  const [period, setPeriod] = useState<Period>('week');
  const [metric, setMetric] = useState<Metric>('time');
  const [anchor, setAnchor] = useState<Anchor>(() => currentAnchor(now));
  const [menuOpen, setMenuOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  useEffect(() => setGoals(loadGoals()), []);
  const goalMin = goals.minutesPerDay;

  // Close the period menu when tapping anywhere else.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (!(e.target as Element).closest?.('.pbs-menu, .pbs-pillbtn')) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const firstYear = useMemo(() => firstReadingYear(events, now), [events, now]);
  const firstTime = useMemo(() => events.reduce((m, e) => Math.min(m, e.startTime), Infinity), [events]);
  const byDay = useMemo(() => secondsByDay(events), [events]);
  const streaks = useMemo(() => computeStreaks(byDay, now), [byDay, now]);

  const info = useMemo(() => periodInfo(period, anchor, now, firstYear), [period, anchor, now, firstYear]);
  const data = useMemo(() => periodData(events, info, now), [events, info, now]);
  const prev: PeriodData | null = useMemo(() => {
    if (period === 'all') return null;
    const pInfo = periodInfo(period, shiftAnchor(period, anchor, -1, now), now, firstYear);
    return periodData(events, pInfo, now);
  }, [events, period, anchor, now, firstYear]);
  const details = useMemo(() => computeDetails(data, now), [data, now]);
  const prevDetails = useMemo(() => (prev ? computeDetails(prev, now) : null), [prev, now]);
  const finished = useMemo(
    () => countFinishedBetween(library, info.start, info.end),
    [library, info.start, info.end],
  );

  const time = metric === 'time';
  const vals = time ? data.seconds : data.pages;
  const goalOn = (period === 'week' || period === 'month') && time;

  // ---- hero numbers
  const total = time ? data.totalSeconds : data.totalPages;
  const prevTotal = prev ? (time ? prev.totalSeconds : prev.totalPages) : 0;
  const delta = period === 'all' ? null : pctDelta(total, prevTotal);

  // ---- chart geometry
  const goalSeconds = goalMin * 60;
  const maxV = Math.max(1, ...vals.map((v) => v ?? 0));
  const axisMax = Math.max(maxV * 1.08, goalOn ? goalSeconds * 1.3 : 0);
  const gap = { week: 10, month: 3, year: 6, all: 16 }[period];
  const radius = { week: 12, month: 3, year: 9, all: 14 }[period];
  const cols = `repeat(${info.count}, minmax(0, 1fr))`;

  const hasEarlier = firstTime < Math.floor(info.start.getTime() / 1000);
  const canPrev = period !== 'all' && hasEarlier;
  const move = (dir: -1 | 1) => setAnchor((a) => shiftAnchor(period, a, dir, now));

  // ---- today's goal
  const todayKey = dayKeyOf(now);
  const todaySeconds = byDay.get(todayKey) ?? 0;
  const goalPct = Math.min(1, todaySeconds / goalSeconds);
  const readMin = Math.floor(todaySeconds / 60);
  const toGo = Math.max(0, goalMin - readMin);
  const week = useMemo(() => goalWeek(byDay, goalMin, now), [byDay, goalMin, now]);
  const metDays = week.filter((d) => d.met).length;
  const CIRC = 2 * Math.PI * 42;

  // ---- rhythm + most read
  const heat = useMemo(() => buildHeatmap(byDay, now, 18), [byDay, now]);
  const top = useMemo(() => topBooks(data.events, 3), [data.events]);

  return (
    <div className='pbs-screen pbs-col'>
      {/* ---------- hero ---------- */}
      <section className='pbs-card' aria-label='Reading summary'>
        <div className='pbs-hero-top'>
          <div className='pbs-label'>
            {time ? 'Read' : 'Pages'} · {info.label}
          </div>
          <div className='pbs-seg' role='group' aria-label='Metric'>
            <button type='button' aria-pressed={time} onClick={() => setMetric('time')}>
              Time
            </button>
            <button type='button' aria-pressed={!time} onClick={() => setMetric('pages')}>
              Pages
            </button>
          </div>
        </div>

        <div className='pbs-big'>
          {time ? (
            <BigTime seconds={total} />
          ) : (
            <>
              <span>{formatCount(total)}</span>
              <span className='pbs-u'>pages</span>
            </>
          )}
        </div>

        {period === 'all' ? (
          <div className='pbs-delta pbs-neu'>Since {firstYear}</div>
        ) : (
          delta !== null && (
            <div className={clsx('pbs-delta', delta < 0 && 'pbs-neg', delta === 0 && 'pbs-neu')}>
              <SIcon name='up' />
              <span>
                {signed(delta)}% vs {info.vsName}
              </span>
            </div>
          )
        )}

        <div
          className='pbs-plot'
          role='img'
          aria-label={`${time ? 'Minutes' : 'Pages'} read per ${info.unit} for ${info.label}${goalOn ? `. Daily goal ${goalMin} minutes.` : '.'}`}
          style={{ gridTemplateColumns: cols, gap, '--br': `${radius}px` } as CSSProperties}
        >
          {goalOn && <div className='pbs-goal' style={{ bottom: Math.round(((goalMin * 60) / axisMax) * AXIS) }} />}
          {vals.map((v, i) => {
            const empty = v === null || v <= 0;
            const h = empty ? 6 : Math.max(8, Math.round((v / axisMax) * AXIS));
            return (
              <div
                key={i}
                className={clsx(
                  'pbs-bar',
                  empty && 'pbs-zero',
                  !empty && goalOn && v < goalSeconds && 'pbs-low',
                  i === info.curIdx && v !== null && 'pbs-today',
                )}
                style={{ height: h }}
              />
            );
          })}
        </div>
        <div className='pbs-days' aria-hidden='true' style={{ gridTemplateColumns: cols, gap }}>
          {info.labels.map((l, i) => (
            <span key={i} className={clsx(i === info.curIdx && 'pbs-now')}>
              {l}
            </span>
          ))}
        </div>

        <div className='pbs-legend'>
          {goalOn && (
            <>
              <span>
                <i />
                Goal met
              </span>
              <span>
                <i className='pbs-low' />
                Below goal
              </span>
              <span>
                <i className='pbs-dash' />
                {goalMin} min goal
              </span>
            </>
          )}
          {info.curIdx >= 0 && (
            <span>
              <i className='pbs-now' />
              In progress
            </span>
          )}
        </div>

        <div className='pbs-hero-foot'>
          <button
            type='button'
            className='pbs-pill pbs-pillbtn'
            aria-haspopup='menu'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span>{PERIODS.find((p) => p.id === period)!.label}</span>
            <SIcon name='cd' />
          </button>
          {menuOpen && (
            <div className='pbs-menu' role='menu' aria-label='Period'>
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type='button'
                  role='menuitemradio'
                  aria-checked={p.id === period}
                  onClick={() => {
                    setPeriod(p.id);
                    setMenuOpen(false);
                  }}
                >
                  <SIcon name='check' />
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {period !== 'all' && (
            <div className='pbs-pager'>
              <button type='button' className='pbs-pn' aria-label='Previous period' disabled={!canPrev} onClick={() => move(-1)}>
                <SIcon name='cl' />
              </button>
              <button type='button' className='pbs-pl' aria-haspopup='dialog' onClick={() => setPicking(true)}>
                {info.pagerLabel}
              </button>
              <button type='button' className='pbs-pn' aria-label='Next period' disabled={info.isCurrent} onClick={() => move(1)}>
                <SIcon name='cr' />
              </button>
            </div>
          )}
        </div>
        <div className='pbs-linkrow'>
          <button type='button' onClick={onOpenSessions}>
            <SIcon name='list' />
            View sessions
            <SIcon name='cr' />
          </button>
        </div>
      </section>

      {/* ---------- highlights ---------- */}
      <section className='pbs-tiles3' aria-label='Highlights'>
        <div className='pbs-t3'>
          <SIcon name='flame' />
          <div className='pbs-v'>
            {streaks.current}
            <small>{streaks.current === 1 ? 'day' : 'days'}</small>
          </div>
          <div className='pbs-l'>Streak</div>
        </div>
        <div className='pbs-t3'>
          <SIcon name='page' />
          <div className='pbs-v'>{formatCount(data.totalPages)}</div>
          <div className='pbs-l'>Pages</div>
        </div>
        <div className='pbs-t3'>
          <SIcon name='done' />
          <div className='pbs-v'>{finished}</div>
          <div className='pbs-l'>Finished</div>
        </div>
      </section>

      {/* ---------- daily goal ---------- */}
      <section className='pbs-card' aria-label='Daily goal'>
        <div className='pbs-goal-row'>
          <div className='pbs-ring'>
            <svg viewBox='0 0 100 100' aria-hidden='true'>
              <circle cx='50' cy='50' r='42' fill='none' stroke='var(--track)' strokeWidth='9' />
              {goalPct > 0 && (
                <circle
                  cx='50'
                  cy='50'
                  r='42'
                  fill='none'
                  stroke='var(--coral)'
                  strokeWidth='9'
                  strokeLinecap='round'
                  strokeDasharray={`${(CIRC * goalPct).toFixed(1)} ${CIRC.toFixed(1)}`}
                />
              )}
            </svg>
            <div className='pbs-pct'>{Math.round(goalPct * 100)}%</div>
          </div>
          <div>
            <h2>Daily goal</h2>
            <p>
              {readMin} of {goalMin} min today
            </p>
            <div className='pbs-togo'>{toGo > 0 ? `${toGo} min to go` : 'Goal reached'}</div>
          </div>
        </div>
        <div
          className='pbs-week'
          aria-label={`Goal met on ${metDays} of the last 7 days`}
        >
          {week.map((d) => (
            <div key={d.key}>
              <span className={clsx('pbs-wd', d.met && 'pbs-met', d.isToday && !d.met && 'pbs-now')}>
                {d.met && <SIcon name='check' />}
              </span>
              <span className={clsx(d.isToday && 'pbs-now-l')}>{d.initial}</span>
            </div>
          ))}
        </div>
        <div className='pbs-goal-foot'>
          <span>Goal met {metDays} of 7 days</span>
          <button type='button' className='pbs-pill' onClick={onOpenGoals}>
            Reading goals
            <SIcon name='cr' />
          </button>
        </div>
      </section>

      {/* ---------- details ---------- */}
      <div className='pbs-label pbs-section-label'>Details · {info.label}</div>
      <DetailTiles
        period={period}
        info={info}
        d={details}
        prev={prevDetails}
        prevHasData={!!prev && prev.summary.sessions > 0}
        goalMin={goalMin}
        firstYear={firstYear}
      />

      {/* ---------- reading rhythm ---------- */}
      <section className='pbs-card' aria-label='Reading rhythm'>
        <div className='pbs-card-head'>
          <h3>Reading rhythm</h3>
          <span>last 18 weeks</span>
        </div>
        <div className='pbs-heat-wrap'>
          <div className='pbs-heat-rows' aria-hidden='true'>
            <span>M</span>
            <span />
            <span>W</span>
            <span />
            <span>F</span>
            <span />
            <span />
          </div>
          <div
            className='pbs-heat'
            role='img'
            aria-label='Heatmap of reading days over the last 18 weeks, darker means more reading'
          >
            {heat.map((col) =>
              col.map((c) => (
                <div
                  key={c.key}
                  className={clsx(
                    'pbs-cell',
                    c.level > 0 && `pbs-l${c.level}`,
                    c.inFuture && 'pbs-fut',
                    c.key === todayKey && 'pbs-today',
                  )}
                />
              )),
            )}
          </div>
        </div>
        <div className='pbs-heat-legend' aria-hidden='true'>
          <span>Less</span>
          <div className='pbs-cell' />
          <div className='pbs-cell pbs-l1' />
          <div className='pbs-cell pbs-l2' />
          <div className='pbs-cell pbs-l3' />
          <div className='pbs-cell pbs-l4' />
          <span>More</span>
        </div>
      </section>

      {/* ---------- reading patterns ---------- */}
      <PatternsCard events={events} now={now} />

      {/* ---------- most read ---------- */}
      {top.length > 0 && (
        <>
          <div className='pbs-label pbs-section-label'>Most read · {info.label}</div>
          <section className='pbs-card' aria-label='Most read'>
            <div className='pbs-books'>
              {top.map((b) => {
                const min = Math.round(b.seconds / 60);
                const dur = min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : `${min}m`;
                const pct = Math.round(b.share * 100);
                return (
                  <div key={b.md5} className='pbs-book'>
                    <Thumb md5={b.md5} book={booksByHash.get(b.md5)} />
                    <div>
                      <h4>{b.title}</h4>
                      <p>
                        {b.authors ? `${b.authors} · ` : ''}
                        {dur}
                      </p>
                      <div className='pbs-meter'>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className='pbs-pc'>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <p className='pbs-note'>
        Pages follow the reader&apos;s own pagination, so they shift a little when you change font size or margins. A
        page visit counts for at most 2 minutes, so a forgotten screen doesn&apos;t inflate your time.
      </p>

      {picking && period !== 'all' && (
        <PeriodDialog
          period={period}
          anchor={anchor}
          now={now}
          onCancel={() => setPicking(false)}
          onOk={(a) => {
            setAnchor(a);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function DetailTiles({
  period,
  info,
  d,
  prev,
  prevHasData,
  goalMin,
  firstYear,
}: {
  period: Period;
  info: { vsName: string };
  d: Details;
  prev: Details | null;
  prevHasData: boolean;
  goalMin: number;
  firstYear: number;
}) {
  const vs = `vs ${info.vsName}`;
  const diff = (cur: number, before: number | undefined) =>
    prevHasData && prev && before !== undefined && cur > 0 ? (
      <>
        <b>{signed(cur - before)}</b> {vs}
      </>
    ) : null;

  const none = d.sessions === 0;
  const n = d.sessions;
  return (
    <section className='pbs-tiles2' aria-label='Details'>
      <div className='pbs-t2'>
        <div className='pbs-l'>Pace</div>
        <div className='pbs-v'>{d.pace ? <>{d.pace}<small>p/h</small></> : '–'}</div>
        <div className='pbs-s'>{diff(d.pace, prev?.pace) ?? 'pages per hour'}</div>
      </div>
      <div className='pbs-t2'>
        <div className='pbs-l'>Avg session</div>
        <div className='pbs-v'>{none ? '–' : <SmallTime seconds={d.avgSessionSeconds} />}</div>
        <div className='pbs-s'>{none ? 'no sessions yet' : `across ${n} ${n === 1 ? 'session' : 'sessions'}`}</div>
      </div>
      <div className='pbs-t2'>
        <div className='pbs-l'>Sessions</div>
        <div className='pbs-v'>{n}</div>
        <div className='pbs-s'>
          {diff(n, prev?.sessions) ?? (period === 'all' ? `since ${firstYear}` : 'in this period')}
        </div>
      </div>
      <div className='pbs-t2'>
        <div className='pbs-l'>Longest session</div>
        <div className='pbs-v'>{d.longest ? <SmallTime seconds={d.longest.seconds} /> : '–'}</div>
        <div className='pbs-s'>{d.longest ? sessionWhen(period, d.longest) : ''}</div>
      </div>
      <div className='pbs-t2'>
        <div className='pbs-l'>Best day</div>
        <div className='pbs-v'>{d.bestDay ? <SmallTime seconds={d.bestDay.seconds} /> : '–'}</div>
        <div className='pbs-s'>{d.bestDay ? dateLabel(period, d.bestDay.date) : ''}</div>
      </div>
      <div className='pbs-t2'>
        <div className='pbs-l'>Average a day</div>
        <div className='pbs-v'>{d.avgPerDaySeconds ? <SmallTime seconds={d.avgPerDaySeconds} /> : '–'}</div>
        <div className='pbs-s'>goal is {goalMin}m</div>
      </div>
    </section>
  );
}
