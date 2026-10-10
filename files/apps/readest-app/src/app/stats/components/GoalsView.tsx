'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PBook } from '@/services/paperback/library';
import {
  booksPace,
  computeStreaks,
  dayKeyOf,
  formatDuration,
  secondsByDay,
  type StatEventRow,
} from '@/services/statistics/statsAggregate';
import { countFinishedThisYear } from '../useStatsData';
import { DEFAULT_GOALS, loadGoals, normalizeGoals, saveGoals, type Goals } from '../goals';
import { Progress, Ring } from './ui';

interface Props {
  events: StatEventRow[];
  library: PBook[];
  now: Date;
}

const FIELDS: { key: keyof Goals; label: string; unit: string }[] = [
  { key: 'booksPerYear', label: 'Books this year', unit: 'books' },
  { key: 'pagesPerDay', label: 'Pages per day', unit: 'pages' },
  { key: 'minutesPerDay', label: 'Minutes per day', unit: 'min' },
  { key: 'streakDays', label: 'Reading streak', unit: 'days' },
];

export default function GoalsView({ events, library, now }: Props) {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [draft, setDraft] = useState<Record<keyof Goals, string> | null>(null);

  useEffect(() => setGoals(loadGoals()), []);

  const today = useMemo(() => {
    const key = dayKeyOf(now);
    const from = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
    const todays = events.filter((e) => e.startTime >= from);
    const pages = new Set(todays.map((e) => `${e.md5}:${e.page}`)).size;
    const seconds = secondsByDay(todays).get(key) ?? 0;
    return { pages, seconds };
  }, [events, now]);

  const streaks = useMemo(() => computeStreaks(secondsByDay(events), now), [events, now]);
  const finished = useMemo(() => countFinishedThisYear(library, now), [library, now]);
  const pace = booksPace(finished, goals.booksPerYear, now);
  const booksPct = Math.min(1, finished / goals.booksPerYear);

  const startEdit = () =>
    setDraft({
      booksPerYear: String(goals.booksPerYear),
      pagesPerDay: String(goals.pagesPerDay),
      minutesPerDay: String(goals.minutesPerDay),
      streakDays: String(goals.streakDays),
    });
  const commit = () => {
    if (!draft) return;
    const next = normalizeGoals(draft);
    setGoals(next);
    saveGoals(next);
    setDraft(null);
  };

  return (
    <div className='pb-stack'>
      <div className='pb-card'>
        <div className='pb-ring-wrap'>
          <Ring value={booksPct}>
            <div className='pb-title' style={{ fontSize: 24 }}>
              {finished}/{goals.booksPerYear}
            </div>
            <div className='pb-label'>books</div>
          </Ring>
          <div>
            <div className='pb-title' style={{ fontSize: 20 }}>
              {now.getFullYear()} goal
            </div>
            <div className='pb-label'>{finished >= goals.booksPerYear ? 'Goal reached' : pace.label}</div>
          </div>
        </div>
      </div>

      <div className='pb-card'>
        <div className='pb-goal-row'>
          <div className='pb-title'>Pages per day</div>
          <div className='pb-label'>
            {today.pages} / {goals.pagesPerDay}
          </div>
        </div>
        <Progress value={today.pages / goals.pagesPerDay} />
      </div>

      <div className='pb-card'>
        <div className='pb-goal-row'>
          <div className='pb-title'>Minutes today</div>
          <div className='pb-label'>
            {formatDuration(today.seconds)} / {goals.minutesPerDay}m
          </div>
        </div>
        <Progress value={today.seconds / 60 / goals.minutesPerDay} />
      </div>

      <div className='pb-card'>
        <div className='pb-goal-row'>
          <div className='pb-title'>Reading streak</div>
          <div className='pb-label'>
            {streaks.current} / {goals.streakDays} days
          </div>
        </div>
        <Progress value={streaks.current / goals.streakDays} />
      </div>

      <div className='pb-card'>
        <div className='pb-goal-row'>
          <div className='pb-title'>Finish by Dec 31</div>
          <div className='pb-label'>{Math.round(booksPct * 100)}%</div>
        </div>
        <Progress value={booksPct} />
      </div>

      {draft ? (
        <div className='pb-card'>
          {FIELDS.map((f) => (
            <label key={f.key} className='pb-field'>
              <span>
                <span className='pb-title' style={{ display: 'block' }}>
                  {f.label}
                </span>
                <span className='pb-label'>{f.unit}</span>
              </span>
              <input
                className='pb-input'
                type='number'
                inputMode='numeric'
                min={1}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            </label>
          ))}
          <div className='pb-stack' style={{ marginTop: 10 }}>
            <button className='pb-btn' onClick={commit}>
              Save goals
            </button>
            <button className='pb-btn ghost' onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className='pb-btn' onClick={startEdit}>
          Edit goals
        </button>
      )}
    </div>
  );
}
