'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { readingPatterns, PATTERN_DAYS, type PatternMetric } from '@/services/statistics/activityStats';
import { formatCount, type StatEventRow } from '@/services/statistics/statsAggregate';
import { SIcon } from './StatsIcons';

const R0 = 34; // inner radius of the clock
const RMAX = 70; // longest sector adds this much

const pol = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
};
const f = (n: number) => n.toFixed(2);
const sector = (r0: number, r1: number, a0: number, a1: number): string => {
  const [x0, y0] = pol(r1, a0);
  const [x1, y1] = pol(r1, a1);
  const [x2, y2] = pol(r0, a1);
  const [x3, y3] = pol(r0, a0);
  return `M${f(x0)} ${f(y0)} A${r1} ${r1} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${r0} ${r0} 0 0 0 ${f(x3)} ${f(y3)} Z`;
};
const hh = (h: number) => String(h).padStart(2, '0');

function Rows({ items, unit, className }: { items: { name: string; value: number }[]; unit: string; className?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className='pbs-rows'>
      {items.map((i) => (
        <div key={i.name} className={clsx('pbs-r', className)}>
          <span>{i.name}</span>
          <div className='pbs-rb'>
            <i style={{ width: `${Math.round((i.value / max) * 100)}%` }} />
          </div>
          <span className='pbs-rv'>
            <b>{formatCount(i.value)}</b> {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** "You read mostly in the evening, on weekdays." with a 24-hour clock and breakdowns (last 90 days). */
export default function PatternsCard({ events, now }: { events: StatEventRow[]; now: Date }) {
  const [metric, setMetric] = useState<PatternMetric>('sessions');
  const [tip, setTip] = useState<number | null>(null);
  const [info, setInfo] = useState<'a' | 'b' | null>(null);
  const p = useMemo(() => readingPatterns(events, metric, now), [events, metric, now]);

  // A tapped sector's label goes away when tapping anywhere else.
  useEffect(() => {
    if (tip === null) return;
    const close = (e: Event) => {
      if (!(e.target as Element).closest?.('.pbs-hit')) setTip(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [tip]);

  const unit = metric === 'sessions' ? 'sessions' : 'pages';
  const unitOf = (n: number) => (n === 1 ? unit.slice(0, -1) : unit);
  const max = Math.max(1, ...p.byHour);
  const empty = p.total === 0;
  const Title = metric === 'sessions' ? 'Sessions' : 'Pages read';

  return (
    <section className='pbs-card' aria-label='Reading patterns'>
      <div className='pbs-card-head'>
        <h3>
          Reading patterns
          <button
            type='button'
            className='pbs-info'
            aria-label='About reading patterns'
            aria-expanded={info === 'a'}
            onClick={() => setInfo(info === 'a' ? null : 'a')}
          >
            <SIcon name='info' />
          </button>
        </h3>
        <div className='pbs-seg' role='group' aria-label='Count by'>
          <button type='button' aria-pressed={metric === 'sessions'} onClick={() => setMetric('sessions')}>
            Sessions
          </button>
          <button type='button' aria-pressed={metric === 'pages'} onClick={() => setMetric('pages')}>
            Pages
          </button>
        </div>
      </div>
      {info === 'a' && (
        <p className='pbs-info-note'>
          Based on your last {PATTERN_DAYS} days. A session counts toward the hour it started in. Pages follow the
          reader&apos;s own pagination.
        </p>
      )}

      {empty ? (
        <p className='pbs-sentence'>Read a little more and your habits will show up here.</p>
      ) : (
        <>
          <p className='pbs-sentence'>
            You read mostly in the <em>{p.topTime.name.toLowerCase()}</em>,{' '}
            {p.weekPart === 'all week' ? (
              <>
                <strong>all week</strong> long.
              </>
            ) : (
              <>
                on <strong>{p.weekPart}</strong>.
              </>
            )}
          </p>

          <div className='pbs-radial-row'>
            <div className='pbs-radial'>
              <svg viewBox='-110 -110 220 220' role='img' aria-label='Reading by hour of day, clock layout'>
                {p.byHour.map((v, h) => {
                  const r1 = R0 + (v ? (v / max) * RMAX : 3);
                  const op = v ? (h === p.peakHour ? 1 : 0.3 + (0.6 * v) / max) : 1;
                  return (
                    <path
                      key={`s${h}`}
                      className='pbs-sl'
                      d={sector(R0, r1, h * 15 + 1, h * 15 + 14)}
                      fill={v ? 'var(--coral)' : 'var(--track)'}
                      fillOpacity={op}
                    />
                  );
                })}
                <text x='0' y='-17' textAnchor='middle' dominantBaseline='central'>00</text>
                <text x='17' y='0' textAnchor='middle' dominantBaseline='central'>06</text>
                <text x='0' y='17' textAnchor='middle' dominantBaseline='central'>12</text>
                <text x='-17' y='0' textAnchor='middle' dominantBaseline='central'>18</text>
                {p.byHour.map((_, h) => (
                  <path
                    key={`h${h}`}
                    className='pbs-hit'
                    tabIndex={0}
                    role='button'
                    aria-label={`${hh(h)} hours`}
                    d={sector(R0, 108, h * 15, h * 15 + 15)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTip(h);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTip(h);
                      }
                    }}
                  />
                ))}
              </svg>
              {tip !== null &&
                (() => {
                  const [x, y] = pol(70, tip * 15 + 7.5);
                  return (
                    <div
                      className='pbs-tip'
                      style={{ left: `${((110 + x) / 220) * 100}%`, top: `${((110 + y) / 220) * 100}%` }}
                    >
                      {hh(tip)}h · {p.byHour[tip]}
                    </div>
                  );
                })()}
            </div>
            <div className='pbs-pstats'>
              <div>
                <div className='pbs-k'>Most active time</div>
                <div className='pbs-v pbs-c'>
                  {p.topTime.name}
                  <small style={{ color: 'inherit' }}>
                    {formatCount(p.topTime.value)} {unitOf(p.topTime.value)}
                  </small>
                </div>
              </div>
              <div>
                <div className='pbs-k'>Most active day</div>
                <div className='pbs-v'>
                  {p.topWeekday.name}
                  <small style={{ color: 'inherit' }}>
                    {formatCount(p.topWeekday.value)} {unitOf(p.topWeekday.value)}
                  </small>
                </div>
              </div>
              <div>
                <div className='pbs-k'>Reading window</div>
                <div className='pbs-v'>
                  {p.peakHour}–{(p.peakHour + 1) % 24}h<small>peak hours</small>
                </div>
              </div>
            </div>
          </div>

          <div className='pbs-sub-head'>
            <span>{Title} by time of day</span>
            <button
              type='button'
              className='pbs-info'
              aria-label='About the times of day'
              aria-expanded={info === 'b'}
              onClick={() => setInfo(info === 'b' ? null : 'b')}
            >
              <SIcon name='info' />
            </button>
          </div>
          {info === 'b' && (
            <p className='pbs-info-note'>
              Morning 5–12 · Afternoon 12–17 · Evening 17–22 · Night 22–5, by the hour you started reading.
            </p>
          )}
          <Rows items={p.byTime} unit={unit} />
          <div className='pbs-sub-head' style={{ marginTop: 24 }}>
            <span>{Title} by day of week</span>
          </div>
          <Rows items={p.byWeekday} unit={unit} className='pbs-b2' />
        </>
      )}
    </section>
  );
}
