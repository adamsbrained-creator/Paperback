'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import {
  MONTH_NAMES,
  MONTH_SHORT,
  type Anchor,
  type Period,
} from '@/services/statistics/activityStats';
import { SIcon } from './StatsIcons';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const YEAR_PAGE = 12;
const YEAR_BASE = 2016;

interface Props {
  period: Exclude<Period, 'all'>;
  anchor: Anchor;
  now: Date;
  onCancel: () => void;
  onOk: (a: Anchor) => void;
}

/** Pick the week (by its last day), month or year the chart shows. */
export default function PeriodDialog({ period, anchor, now, onCancel, onOk }: Props) {
  const today = startOfDay(now);
  const ref = useRef<HTMLDivElement>(null);

  // What is picked, and which month / year / 12-year page the dialog is showing.
  const [end, setEnd] = useState(anchor.weekEnd);
  const [viewY, setViewY] = useState(period === 'week' ? anchor.weekEnd.getFullYear() : anchor.month.y);
  const [viewM, setViewM] = useState(anchor.weekEnd.getMonth());
  const [pickM, setPickM] = useState(anchor.month);
  const [pickY, setPickY] = useState(anchor.year);
  const [yearPage, setYearPage] = useState(YEAR_BASE + YEAR_PAGE * Math.floor((anchor.year - YEAR_BASE) / YEAR_PAGE));

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const ok = () => {
    if (period === 'week') onOk({ ...anchor, weekEnd: end });
    else if (period === 'month') onOk({ ...anchor, month: pickM });
    else onOk({ ...anchor, year: pickY });
  };

  let body: React.ReactNode;
  if (period === 'week') {
    const first = new Date(viewY, viewM, 1);
    const offset = (first.getDay() + 6) % 7;
    const n = new Date(viewY, viewM + 1, 0).getDate();
    const start = addDays(end, -6);
    const atCap = viewY === today.getFullYear() && viewM === today.getMonth();
    const step = (d: number) => {
      const idx = viewY * 12 + viewM + d;
      setViewY(Math.floor(idx / 12));
      setViewM(((idx % 12) + 12) % 12);
    };
    body = (
      <>
        <div className='pbs-kicker'>Choose a week</div>
        <div className='pbs-head'>
          <div className='pbs-t' id='pbs-dlg-title'>
            {MONTH_NAMES[viewM]} {viewY}
          </div>
          <div className='pbs-nav'>
            <button type='button' aria-label='Previous month' onClick={() => step(-1)}>
              <SIcon name='cl' />
            </button>
            <button type='button' aria-label='Next month' disabled={atCap} onClick={() => step(1)}>
              <SIcon name='cr' />
            </button>
          </div>
        </div>
        <div className='pbs-cal'>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((c, i) => (
            <div key={i} className='pbs-dh'>
              {c}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div key={`o${i}`} />
          ))}
          {Array.from({ length: n }, (_, i) => {
            const date = new Date(viewY, viewM, i + 1);
            const sel = same(date, start) || same(date, end);
            return (
              <button
                key={i}
                type='button'
                disabled={date.getTime() > today.getTime()}
                className={clsx(
                  date >= start && date <= end && 'pbs-in',
                  sel && 'pbs-sel',
                  same(date, today) && !sel && 'pbs-tdy',
                )}
                onClick={() => setEnd(date)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className='pbs-readout'>
          Seven days ending{' '}
          <b>
            {end.getDate()} {MONTH_SHORT[end.getMonth()]}
          </b>
        </p>
      </>
    );
  } else if (period === 'month') {
    body = (
      <>
        <div className='pbs-kicker'>Choose a month</div>
        <div className='pbs-head'>
          <div className='pbs-t' id='pbs-dlg-title'>
            {viewY}
          </div>
          <div className='pbs-nav'>
            <button type='button' aria-label='Previous year' onClick={() => setViewY(viewY - 1)}>
              <SIcon name='cl' />
            </button>
            <button type='button' aria-label='Next year' disabled={viewY >= today.getFullYear()} onClick={() => setViewY(viewY + 1)}>
              <SIcon name='cr' />
            </button>
          </div>
        </div>
        <div className='pbs-pick pbs-m3'>
          {MONTH_SHORT.map((m, i) => (
            <button
              key={m}
              type='button'
              className={clsx(pickM.y === viewY && pickM.m === i && 'pbs-sel')}
              disabled={viewY > today.getFullYear() || (viewY === today.getFullYear() && i > today.getMonth())}
              onClick={() => setPickM({ y: viewY, m: i })}
            >
              {m}
            </button>
          ))}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className='pbs-kicker'>Choose a year</div>
        <div className='pbs-head'>
          <div className='pbs-t' id='pbs-dlg-title'>
            {yearPage}–{yearPage + YEAR_PAGE - 1}
          </div>
          <div className='pbs-nav'>
            <button type='button' aria-label='Earlier years' onClick={() => setYearPage(yearPage - YEAR_PAGE)}>
              <SIcon name='cu' />
            </button>
            <button
              type='button'
              aria-label='Later years'
              disabled={yearPage + YEAR_PAGE - 1 >= today.getFullYear()}
              onClick={() => setYearPage(yearPage + YEAR_PAGE)}
            >
              <SIcon name='cd' />
            </button>
          </div>
        </div>
        <div className='pbs-pick pbs-y4'>
          {Array.from({ length: YEAR_PAGE }, (_, i) => yearPage + i).map((y) => (
            <button
              key={y}
              type='button'
              className={clsx(pickY === y && 'pbs-sel')}
              disabled={y > today.getFullYear()}
              onClick={() => setPickY(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className='pbs pbs-scrim' onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className='pbs-dlg' role='dialog' aria-modal='true' aria-labelledby='pbs-dlg-title' tabIndex={-1}>
        {body}
        <div className='pbs-dlg-foot'>
          <button type='button' onClick={onCancel}>
            Cancel
          </button>
          <button type='button' className='pbs-ok' onClick={ok}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
