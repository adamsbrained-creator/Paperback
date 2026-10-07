// Paperback: pure aggregation over KOReader-style page-read events.
// No React, no DB, no Date.now() — everything takes `now` so it is testable.
// All day/hour bucketing uses the device's LOCAL time zone.

export interface StatEventRow {
  md5: string;
  title: string;
  authors: string;
  page: number;
  startTime: number; // Unix seconds
  duration: number; // seconds
  totalPages: number;
}

export type StatsRange = 'week' | 'month' | 'year';

export interface Summary {
  seconds: number;
  pages: number;
  books: number;
  sessions: number;
  avgSessionSeconds: number;
  pagesPerHour: number;
}

export interface Bar {
  label: string;
  pages: number;
  seconds: number;
  isTop: boolean;
}

export interface HeatCell {
  key: string; // yyyy-mm-dd
  seconds: number;
  level: 0 | 1 | 2 | 3 | 4;
  inFuture: boolean;
}

export interface TopBook {
  md5: string;
  title: string;
  authors: string;
  seconds: number;
  share: number; // 0..1 of range time
}

export interface Session {
  md5: string;
  title: string;
  start: number; // Unix seconds
  end: number;
  seconds: number;
  pageFrom: number;
  pageTo: number;
}

export interface SessionDay {
  key: string;
  label: string; // TODAY / YESTERDAY / SEP 30
  sessions: Session[];
}

/** A page visit longer than this is a forgotten screen, not reading. */
const MAX_EVENT_SECONDS = 120;
/** Two events of the same book closer than this belong to one session. */
const SESSION_GAP_SECONDS = 10 * 60;
/** A day counts toward the streak after this much reading. */
export const STREAK_MIN_SECONDS = 60;

const pad = (n: number) => String(n).padStart(2, '0');

export const dayKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const dayKeyOfSec = (sec: number): string => dayKeyOf(new Date(sec * 1000));

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday = 0 … Sunday = 6. */
const mondayIndex = (d: Date): number => (d.getDay() + 6) % 7;

const clampDuration = (e: StatEventRow): number =>
  Math.max(0, Math.min(e.duration, MAX_EVENT_SECONDS));

export function rangeStart(range: StatsRange, now: Date): Date {
  const today = startOfDay(now);
  if (range === 'week') return addDays(today, -mondayIndex(today));
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

export function eventsInRange(
  events: StatEventRow[],
  range: StatsRange,
  now: Date,
): StatEventRow[] {
  const from = Math.floor(rangeStart(range, now).getTime() / 1000);
  return events.filter((e) => e.startTime >= from);
}

export function buildSessions(events: StatEventRow[]): Session[] {
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  const sessions: Session[] = [];
  let cur: Session | null = null;
  for (const e of sorted) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    const end = e.startTime + dur;
    if (cur && cur.md5 === e.md5 && e.startTime - cur.end <= SESSION_GAP_SECONDS) {
      cur.seconds += dur;
      cur.end = Math.max(cur.end, end);
      cur.pageFrom = Math.min(cur.pageFrom, e.page);
      cur.pageTo = Math.max(cur.pageTo, e.page);
    } else {
      cur = {
        md5: e.md5,
        title: e.title,
        start: e.startTime,
        end,
        seconds: dur,
        pageFrom: e.page,
        pageTo: e.page,
      };
      sessions.push(cur);
    }
  }
  return sessions;
}

export function computeSummary(events: StatEventRow[]): Summary {
  let seconds = 0;
  const pages = new Set<string>();
  const books = new Set<string>();
  for (const e of events) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    seconds += dur;
    pages.add(`${e.md5}:${e.page}`);
    books.add(e.md5);
  }
  const sessions = buildSessions(events).length;
  return {
    seconds,
    pages: pages.size,
    books: books.size,
    sessions,
    avgSessionSeconds: sessions ? Math.round(seconds / sessions) : 0,
    pagesPerHour: seconds > 0 ? Math.round((pages.size / seconds) * 3600) : 0,
  };
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Bars for the chart: week = 7 days, month = days of month, year = 12 months. */
export function buildBars(events: StatEventRow[], range: StatsRange, now: Date): Bar[] {
  let count: number;
  let indexOf: (startSec: number) => number;
  let labelOf: (i: number) => string;

  if (range === 'week') {
    const from = rangeStart('week', now);
    count = 7;
    indexOf = (s) => Math.floor((startOfDay(new Date(s * 1000)).getTime() - from.getTime()) / 864e5 + 0.5);
    labelOf = (i) => WEEK_LABELS[i] ?? '';
  } else if (range === 'month') {
    count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    indexOf = (s) => new Date(s * 1000).getDate() - 1;
    labelOf = (i) => String(i + 1);
  } else {
    count = 12;
    indexOf = (s) => new Date(s * 1000).getMonth();
    labelOf = (i) => MONTH_LABELS[i] ?? '';
  }

  const pageSets: Set<string>[] = Array.from({ length: count }, () => new Set<string>());
  const seconds: number[] = new Array(count).fill(0);
  for (const e of eventsInRange(events, range, now)) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    const i = indexOf(e.startTime);
    if (i < 0 || i >= count) continue;
    seconds[i]! += dur;
    pageSets[i]!.add(`${e.md5}:${e.page}`);
  }
  const pages = pageSets.map((s) => s.size);
  const max = Math.max(0, ...pages);
  const topIndex = max > 0 ? pages.indexOf(max) : -1;
  return pages.map((p, i) => ({
    label: labelOf(i),
    pages: p,
    seconds: seconds[i]!,
    isTop: i === topIndex,
  }));
}

/** Seconds read per local day, all time. */
export function secondsByDay(events: StatEventRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    const k = dayKeyOfSec(e.startTime);
    map.set(k, (map.get(k) ?? 0) + dur);
  }
  return map;
}

export function computeStreaks(
  byDay: Map<string, number>,
  now: Date,
): { current: number; longest: number } {
  const qualifies = (d: Date) => (byDay.get(dayKeyOf(d)) ?? 0) >= STREAK_MIN_SECONDS;
  const today = startOfDay(now);

  // Current: today may still be in progress, so an empty today does not break it.
  let cursor = qualifies(today) ? today : addDays(today, -1);
  let current = 0;
  while (qualifies(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const days = [...byDay.entries()]
    .filter(([, s]) => s >= STREAK_MIN_SECONDS)
    .map(([k]) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y!, m! - 1, d!);
    })
    .sort((a, b) => a.getTime() - b.getTime());
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    run = prev && dayKeyOf(addDays(prev, 1)) === dayKeyOf(d) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest: Math.max(longest, current) };
}

const levelOf = (seconds: number): HeatCell['level'] => {
  const min = seconds / 60;
  if (min < 1) return 0;
  if (min < 15) return 1;
  if (min < 30) return 2;
  if (min < 60) return 3;
  return 4;
};

/** `weeks` columns × 7 rows (Mon→Sun), the last column is the current week. */
export function buildHeatmap(byDay: Map<string, number>, now: Date, weeks = 18): HeatCell[][] {
  const today = startOfDay(now);
  const lastMonday = addDays(today, -mondayIndex(today));
  const firstMonday = addDays(lastMonday, -7 * (weeks - 1));
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstMonday, w * 7 + d);
      const key = dayKeyOf(date);
      const seconds = byDay.get(key) ?? 0;
      const inFuture = date.getTime() > today.getTime();
      col.push({ key, seconds, level: inFuture ? 0 : levelOf(seconds), inFuture });
    }
    columns.push(col);
  }
  return columns;
}

/** Seconds read per hour of day (0–23), by the hour each page visit began. */
export function hourDistribution(events: StatEventRow[]): number[] {
  const hours: number[] = new Array(24).fill(0);
  for (const e of events) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    hours[new Date(e.startTime * 1000).getHours()]! += dur;
  }
  return hours;
}

export function topBooks(events: StatEventRow[], limit = 5): TopBook[] {
  const map = new Map<string, TopBook>();
  let total = 0;
  for (const e of events) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    total += dur;
    const cur = map.get(e.md5);
    if (cur) cur.seconds += dur;
    else map.set(e.md5, { md5: e.md5, title: e.title, authors: e.authors, seconds: dur, share: 0 });
  }
  return [...map.values()]
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit)
    .map((b) => ({ ...b, share: total ? b.seconds / total : 0 }));
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function groupSessionsByDay(sessions: Session[], now: Date): SessionDay[] {
  const todayKey = dayKeyOf(now);
  const yesterdayKey = dayKeyOf(addDays(startOfDay(now), -1));
  const days = new Map<string, SessionDay>();
  for (const s of [...sessions].sort((a, b) => b.start - a.start)) {
    const d = new Date(s.start * 1000);
    const key = dayKeyOf(d);
    let day = days.get(key);
    if (!day) {
      const label =
        key === todayKey
          ? 'TODAY'
          : key === yesterdayKey
            ? 'YESTERDAY'
            : `${MONTHS[d.getMonth()]} ${d.getDate()}`;
      day = { key, label, sessions: [] };
      days.set(key, day);
    }
    day.sessions.push(s);
  }
  return [...days.values()];
}

export const formatClock = (sec: number): string => {
  const d = new Date(sec * 1000);
  return `${d.getHours()}:${pad(d.getMinutes())}`;
};

/** 112h · 1h 05m · 42m · 0m */
export const formatDuration = (seconds: number): string => {
  const mins = Math.round(seconds / 60);
  if (mins >= 6000) return `${Math.round(mins / 60)}h`;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${pad(m)}m`;
  }
  return `${mins}m`;
};

export const formatCount = (n: number): string => n.toLocaleString('en-US');

export interface PaceInfo {
  expected: number;
  delta: number; // finished - expected (rounded down); >=0 on pace
  label: string;
}

/** Books-goal pace: finished vs. what a straight line through the year predicts. */
export function booksPace(finished: number, goal: number, now: Date): PaceInfo {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const elapsed = (now.getTime() - start) / (end - start);
  const expected = Math.floor(goal * elapsed);
  const delta = finished - expected;
  const left = Math.max(goal - finished, 0);
  const status = delta >= 0 ? 'on pace' : `${-delta} behind`;
  return { expected, delta, label: `${left} to go · ${status}` };
}

// ---- rolling windows for the Stats screen ------------------------------------------------
// Week = the last 7 days, month = the last 30 days, year = the last 12 months, each ending today,
// compared with the window of the same length right before it.

export interface RollingBar {
  label: string;
  seconds: number;
  pages: number;
  isCurrent: boolean; // today / this month
}

export interface RollingStats {
  bars: RollingBar[];
  seconds: number;
  pages: number;
  previousSeconds: number;
  /** Percent change of time read vs the previous window, or null when there was nothing before. */
  deltaPct: number | null;
  start: Date; // first day of the window
  windowLabel: string; // "7 days" | "30 days" | "12 months"
}

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function rollingStats(events: StatEventRow[], range: StatsRange, now: Date): RollingStats {
  const today = startOfDay(now);
  const isYear = range === 'year';
  const count = range === 'week' ? 7 : range === 'month' ? 30 : 12;

  // Bucket index of an instant, counted so that the last bucket is "now": 0..count-1 inside the
  // window, negative before it.
  const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const bucketOf = (startSec: number): number => {
    const d = new Date(startSec * 1000);
    if (isYear) return monthIndex(d) - (monthIndex(today) - (count - 1));
    const dayDiff = Math.round((startOfDay(d).getTime() - today.getTime()) / 864e5);
    return dayDiff + (count - 1);
  };

  const seconds: number[] = new Array(count).fill(0);
  const pageSets: Set<string>[] = Array.from({ length: count }, () => new Set<string>());
  let previousSeconds = 0;
  for (const e of events) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    const b = bucketOf(e.startTime);
    if (b >= 0 && b < count) {
      seconds[b]! += dur;
      pageSets[b]!.add(`${e.md5}:${e.page}`);
    } else if (b < 0 && b >= -count) {
      previousSeconds += dur;
    }
  }

  const labelOf = (i: number): string => {
    if (isYear) {
      const d = new Date(today.getFullYear(), today.getMonth() - (count - 1 - i), 1);
      return 'JFMAMJJASOND'[d.getMonth()]!;
    }
    const d = addDays(today, i - (count - 1));
    if (range === 'week') return WEEKDAY_INITIALS[d.getDay()]!;
    return (count - 1 - i) % 5 === 0 ? String(d.getDate()) : '';
  };

  const bars: RollingBar[] = seconds.map((s, i) => ({
    label: labelOf(i),
    seconds: s,
    pages: pageSets[i]!.size,
    isCurrent: i === count - 1,
  }));
  const total = seconds.reduce((a, b) => a + b, 0);
  const start = isYear
    ? new Date(today.getFullYear(), today.getMonth() - (count - 1), 1)
    : addDays(today, -(count - 1));
  return {
    bars,
    seconds: total,
    pages: new Set(pageSets.flatMap((s) => [...s])).size,
    previousSeconds,
    deltaPct: previousSeconds > 0 ? Math.round(((total - previousSeconds) / previousSeconds) * 100) : null,
    start,
    windowLabel: range === 'week' ? '7 days' : range === 'month' ? '30 days' : '12 months',
  };
}
