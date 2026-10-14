// Paperback: everything the Stats → Activity page computes, as pure functions.
// No React, no DB, no Date.now(): all take `now`. Day/hour bucketing uses the device's local time zone.

import {
  buildSessions,
  clampDuration,
  computeSummary,
  dayKeyOf,
  secondsByDay,
  type Session,
  type StatEventRow,
  type Summary,
} from './statsAggregate';

export type Period = 'week' | 'month' | 'year' | 'all';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date): boolean => dayKeyOf(a) === dayKeyOf(b);
const daysBetween = (a: Date, b: Date): number =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 864e5);
const sec = (d: Date): number => Math.floor(d.getTime() / 1000);

// ---- periods ----------------------------------------------------------------------------

/** Which window the hero chart shows. Only the part that belongs to the chosen period is used. */
export interface Anchor {
  /** Week: the last of the seven days. */
  weekEnd: Date;
  /** Month: year and month (0–11). */
  month: { y: number; m: number };
  year: number;
}

export const currentAnchor = (now: Date): Anchor => ({
  weekEnd: startOfDay(now),
  month: { y: now.getFullYear(), m: now.getMonth() },
  year: now.getFullYear(),
});

export interface PeriodInfo {
  period: Period;
  start: Date; // first day of the window
  end: Date; // last day of the window (can be after today for a running month / year)
  isCurrent: boolean;
  /** "last 7 days" · "7 – 13 Oct" · "October" · "2026" · "all time" */
  label: string;
  /** Shown between the pager arrows: "7 – 13 Oct" · "October 2026" · "2026". Empty for all time. */
  pagerLabel: string;
  /** "previous week" · "September" · "2025" */
  vsName: string;
  unit: 'day' | 'month' | 'year';
  labels: string[]; // one per bar
  count: number; // number of bars
  curIdx: number; // the running bar (today / this month / this year), or -1
  firstYear: number; // all time: the first bar's year
}

/** "7 – 13 Oct", or "28 Dec – 3 Jan 2026" when the week crosses a month or year. */
export function weekRangeLabel(end: Date): string {
  const s = addDays(end, -6);
  const e = `${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`;
  if (s.getMonth() === end.getMonth() && s.getFullYear() === end.getFullYear()) return `${s.getDate()} – ${e}`;
  const sp = `${s.getDate()} ${MONTH_SHORT[s.getMonth()]}`;
  return `${sp} – ${e}${s.getFullYear() !== end.getFullYear() ? ` ${end.getFullYear()}` : ''}`;
}

/** The first year with any reading (for All time), or this year when there is none. */
export function firstReadingYear(events: StatEventRow[], now: Date): number {
  let min = Infinity;
  for (const e of events) if (e.startTime < min) min = e.startTime;
  return Number.isFinite(min) ? Math.min(new Date(min * 1000).getFullYear(), now.getFullYear()) : now.getFullYear();
}

export function periodInfo(period: Period, anchor: Anchor, now: Date, firstYear: number): PeriodInfo {
  const today = startOfDay(now);
  if (period === 'week') {
    const end = anchor.weekEnd.getTime() > today.getTime() ? today : startOfDay(anchor.weekEnd);
    const isCurrent = sameDay(end, today);
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) labels.push(DAY_INITIALS[addDays(end, i - 6).getDay()]!);
    return {
      period, start: addDays(end, -6), end, isCurrent,
      label: isCurrent ? 'last 7 days' : weekRangeLabel(end),
      pagerLabel: weekRangeLabel(end),
      vsName: isCurrent ? 'last week' : 'the week before',
      unit: 'day', labels, count: 7, curIdx: isCurrent ? 6 : -1, firstYear,
    };
  }
  if (period === 'month') {
    const { y, m } = anchor.month;
    const n = new Date(y, m + 1, 0).getDate();
    const isCurrent = y === now.getFullYear() && m === now.getMonth();
    const labels: string[] = [];
    for (let i = 0; i < n; i++) labels.push(i % 7 === 0 ? String(i + 1) : '');
    return {
      period, start: new Date(y, m, 1), end: new Date(y, m, n), isCurrent,
      label: MONTH_NAMES[m]! + (y === now.getFullYear() ? '' : ` ${y}`),
      pagerLabel: `${MONTH_NAMES[m]} ${y}`,
      vsName: MONTH_NAMES[(m + 11) % 12]!,
      unit: 'day', labels, count: n, curIdx: isCurrent ? now.getDate() - 1 : -1, firstYear,
    };
  }
  if (period === 'year') {
    const y = anchor.year;
    const isCurrent = y === now.getFullYear();
    return {
      period, start: new Date(y, 0, 1), end: new Date(y, 11, 31), isCurrent,
      label: String(y), pagerLabel: String(y), vsName: String(y - 1),
      unit: 'month', labels: [...'JFMAMJJASOND'], count: 12, curIdx: isCurrent ? now.getMonth() : -1, firstYear,
    };
  }
  // All time: one bar per year, at least two so the chart is not a single block.
  const first = Math.min(firstYear, now.getFullYear() - 1);
  const years = now.getFullYear() - first + 1;
  const labels: string[] = [];
  for (let i = 0; i < years; i++) labels.push(String(first + i));
  return {
    period, start: new Date(first, 0, 1), end: new Date(now.getFullYear(), 11, 31), isCurrent: true,
    label: 'all time', pagerLabel: '', vsName: '',
    unit: 'year', labels, count: years, curIdx: years - 1, firstYear: first,
  };
}

/** The anchor one step earlier (-1) or later (+1); never later than the current period. */
export function shiftAnchor(period: Period, anchor: Anchor, dir: -1 | 1, now: Date): Anchor {
  const today = startOfDay(now);
  if (period === 'week') {
    const next = addDays(anchor.weekEnd, 7 * dir);
    return { ...anchor, weekEnd: next.getTime() > today.getTime() ? today : next };
  }
  if (period === 'month') {
    const idx = anchor.month.y * 12 + anchor.month.m + dir;
    const cap = now.getFullYear() * 12 + now.getMonth();
    const v = Math.min(idx, cap);
    return { ...anchor, month: { y: Math.floor(v / 12), m: v % 12 } };
  }
  if (period === 'year') return { ...anchor, year: Math.min(anchor.year + dir, now.getFullYear()) };
  return anchor;
}

// ---- bars + totals ------------------------------------------------------------------------

export interface PeriodData {
  info: PeriodInfo;
  /** Seconds / distinct pages per bar; null for bars that are still in the future. */
  seconds: (number | null)[];
  pages: (number | null)[];
  totalSeconds: number;
  totalPages: number;
  /** Events inside the window. */
  events: StatEventRow[];
  summary: Summary;
  sessions: Session[];
}

function bucketIndex(info: PeriodInfo, d: Date): number {
  if (info.period === 'week') return daysBetween(info.start, d);
  if (info.period === 'month') return d.getDate() - 1;
  if (info.period === 'year') return d.getMonth();
  return d.getFullYear() - info.firstYear;
}

export function periodData(events: StatEventRow[], info: PeriodInfo, now: Date): PeriodData {
  const from = info.period === 'all' ? 0 : sec(info.start);
  const to = info.period === 'all' ? Infinity : sec(addDays(info.end, 1));
  const inWindow = events.filter((e) => e.startTime >= from && e.startTime < to);

  const secs: number[] = new Array(info.count).fill(0);
  const pageSets: Set<string>[] = Array.from({ length: info.count }, () => new Set<string>());
  for (const e of inWindow) {
    const dur = clampDuration(e);
    if (dur <= 0) continue;
    const i = bucketIndex(info, new Date(e.startTime * 1000));
    if (i < 0 || i >= info.count) continue;
    secs[i]! += dur;
    pageSets[i]!.add(`${e.md5}:${e.page}`);
  }

  // A bar is "future" when it starts after today.
  const today = startOfDay(now);
  const barStart = (i: number): Date => {
    if (info.period === 'week') return addDays(info.start, i);
    if (info.period === 'month') return new Date(info.start.getFullYear(), info.start.getMonth(), i + 1);
    if (info.period === 'year') return new Date(info.start.getFullYear(), i, 1);
    return new Date(info.firstYear + i, 0, 1);
  };
  const seconds = secs.map((s, i) => (barStart(i).getTime() > today.getTime() ? null : s));
  const pages = pageSets.map((p, i) => (seconds[i] === null ? null : p.size));
  const sum = (a: (number | null)[]) => a.reduce<number>((t, v) => t + (v ?? 0), 0);

  return {
    info,
    seconds,
    pages,
    totalSeconds: sum(seconds),
    totalPages: sum(pages),
    events: inWindow,
    summary: computeSummary(inWindow),
    sessions: buildSessions(inWindow),
  };
}

/** Whole-number percent change, or null when there is nothing to compare with. */
export const pctDelta = (cur: number, prev: number): number | null =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

// ---- the six detail tiles -----------------------------------------------------------------

export interface Details {
  pace: number; // pages per hour
  avgSessionSeconds: number;
  sessions: number;
  longest: Session | null;
  bestDay: { date: Date; seconds: number } | null;
  avgPerDaySeconds: number;
}

export function computeDetails(data: PeriodData, now: Date): Details {
  const { info, events, summary, sessions } = data;
  let longest: Session | null = null;
  for (const s of sessions) if (!longest || s.seconds > longest.seconds) longest = s;

  const byDay = secondsByDay(events);
  let bestDay: Details['bestDay'] = null;
  let firstDay: Date | null = null;
  for (const [key, seconds] of byDay) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y!, m! - 1, d!);
    if (!bestDay || seconds > bestDay.seconds) bestDay = { date, seconds };
    if (!firstDay || date.getTime() < firstDay.getTime()) firstDay = date;
  }

  // Days that have passed so far in the window (all time: since the first day with reading).
  const today = startOfDay(now);
  const winStart = info.period === 'all' ? (firstDay ?? today) : info.start;
  const winEnd = info.end.getTime() > today.getTime() ? today : info.end;
  const days = Math.max(1, daysBetween(winStart, winEnd) + 1);

  return {
    pace: summary.pagesPerHour,
    avgSessionSeconds: summary.avgSessionSeconds,
    sessions: summary.sessions,
    longest,
    bestDay,
    avgPerDaySeconds: Math.round(summary.seconds / days),
  };
}

export const timeOfDayName = (hour: number): 'Morning' | 'Afternoon' | 'Evening' | 'Night' =>
  hour >= 5 && hour < 12 ? 'Morning' : hour >= 12 && hour < 17 ? 'Afternoon' : hour >= 17 && hour < 22 ? 'Evening' : 'Night';

/** "Sat 10 Oct" · "3 Sep" · "3 Sep 2026" · "Saturday" depending on the period. */
export function dateLabel(period: Period, d: Date): string {
  const dm = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  if (period === 'week') return WEEKDAY_NAMES[d.getDay()]!;
  if (period === 'month') return `${WEEKDAY_SHORT[d.getDay()]} ${dm}`;
  if (period === 'year') return dm;
  return `${dm} ${d.getFullYear()}`;
}

/** The longest session's "when": "Saturday evening" for a week, otherwise the date. */
export function sessionWhen(period: Period, s: Session): string {
  const d = new Date(s.start * 1000);
  if (period === 'week') return `${WEEKDAY_NAMES[d.getDay()]} ${timeOfDayName(d.getHours()).toLowerCase()}`;
  return dateLabel(period, d);
}

// ---- goal over the last seven days --------------------------------------------------------

export interface GoalDay {
  key: string;
  initial: string;
  met: boolean;
  isToday: boolean;
}

export function goalWeek(byDay: Map<string, number>, goalMinutes: number, now: Date): GoalDay[] {
  const today = startOfDay(now);
  const out: GoalDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dayKeyOf(d);
    out.push({
      key,
      initial: DAY_INITIALS[d.getDay()]!,
      met: (byDay.get(key) ?? 0) >= goalMinutes * 60,
      isToday: i === 0,
    });
  }
  return out;
}

// ---- reading patterns (last 90 days) ------------------------------------------------------

export type PatternMetric = 'sessions' | 'pages';
export const PATTERN_DAYS = 90;
export const TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
/** Monday first. */
export const WEEKDAYS_MON_FIRST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface Patterns {
  total: number;
  byHour: number[]; // 24
  byTime: { name: (typeof TIME_OF_DAY)[number]; value: number }[]; // 4
  byWeekday: { name: string; value: number }[]; // Monday first
  topTime: { name: string; value: number };
  topWeekday: { name: string; value: number };
  peakHour: number;
  /** Compares the per-day average of Mon–Fri with Sat–Sun (15% apart or more wins). */
  weekPart: 'weekdays' | 'weekends' | 'all week';
}

export function readingPatterns(events: StatEventRow[], metric: PatternMetric, now: Date): Patterns {
  const from = sec(addDays(startOfDay(now), -(PATTERN_DAYS - 1)));
  const recent = events.filter((e) => e.startTime >= from);
  const starts: number[] = []; // one entry (a start time) per counted session or page
  if (metric === 'sessions') {
    for (const s of buildSessions(recent)) starts.push(s.start);
  } else {
    const seen = new Set<string>();
    for (const e of [...recent].sort((a, b) => a.startTime - b.startTime)) {
      if (clampDuration(e) <= 0) continue;
      const k = `${dayKeyOf(new Date(e.startTime * 1000))}:${e.md5}:${e.page}`;
      if (seen.has(k)) continue;
      seen.add(k);
      starts.push(e.startTime);
    }
  }

  const byHour: number[] = new Array(24).fill(0);
  const time: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  const weekday: number[] = new Array(7).fill(0); // Monday first
  for (const t of starts) {
    const d = new Date(t * 1000);
    byHour[d.getHours()]! += 1;
    time[timeOfDayName(d.getHours())]! += 1;
    weekday[(d.getDay() + 6) % 7]! += 1;
  }

  const byTime = TIME_OF_DAY.map((name) => ({ name, value: time[name]! }));
  const byWeekday = WEEKDAYS_MON_FIRST.map((name, i) => ({ name, value: weekday[i]! }));
  const top = <T extends { value: number }>(a: T[]): T => a.reduce((b, x) => (x.value > b.value ? x : b), a[0]!);
  const peakHour = byHour.indexOf(Math.max(...byHour));

  const wd = weekday.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const we = weekday.slice(5).reduce((a, b) => a + b, 0) / 2;
  const weekPart = wd > we * 1.15 ? 'weekdays' : we > wd * 1.15 ? 'weekends' : 'all week';

  return {
    total: starts.length,
    byHour,
    byTime,
    byWeekday,
    topTime: top(byTime),
    topWeekday: top(byWeekday),
    peakHour,
    weekPart,
  };
}

// ---- sessions screen ----------------------------------------------------------------------

export interface MonthSessions {
  month: number; // 0–11
  name: string;
  pages: number; // distinct pages read in the month
  sessions: Session[]; // newest first
}

/** Years that have at least one session, newest first. */
export function sessionYears(events: StatEventRow[]): number[] {
  const years = new Set<number>();
  for (const s of buildSessions(events)) years.add(new Date(s.start * 1000).getFullYear());
  return [...years].sort((a, b) => b - a);
}

/** Months of `year` that have sessions, newest first. */
export function monthsOfYear(events: StatEventRow[], year: number): MonthSessions[] {
  const sessions = buildSessions(events).filter((s) => new Date(s.start * 1000).getFullYear() === year);
  const pageSets: Set<string>[] = Array.from({ length: 12 }, () => new Set<string>());
  for (const e of events) {
    const d = new Date(e.startTime * 1000);
    if (d.getFullYear() !== year || clampDuration(e) <= 0) continue;
    pageSets[d.getMonth()]!.add(`${e.md5}:${e.page}`);
  }
  const out: MonthSessions[] = [];
  for (let m = 11; m >= 0; m--) {
    const list = sessions.filter((s) => new Date(s.start * 1000).getMonth() === m).sort((a, b) => b.start - a.start);
    if (list.length) out.push({ month: m, name: MONTH_NAMES[m]!, pages: pageSets[m]!.size, sessions: list });
  }
  return out;
}

/** "13 Oct · 8:41" */
export function sessionStamp(s: Session): string {
  const d = new Date(s.start * 1000);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Pages 107–137 · 31 pages" */
export function sessionPagesText(s: Session): string {
  const range = s.pageFrom === s.pageTo ? `Page ${s.pageFrom}` : `Pages ${s.pageFrom}–${s.pageTo}`;
  return `${range} · ${s.pages} ${s.pages === 1 ? 'page' : 'pages'}`;
}
