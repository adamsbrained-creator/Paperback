import { describe, it, expect } from 'vitest';
import {
  computeDetails,
  currentAnchor,
  firstReadingYear,
  goalWeek,
  monthsOfYear,
  pctDelta,
  periodData,
  periodInfo,
  readingPatterns,
  sessionPagesText,
  sessionWhen,
  sessionYears,
  shiftAnchor,
  weekRangeLabel,
} from '@/services/statistics/activityStats';
import { secondsByDay, type StatEventRow } from '@/services/statistics/statsAggregate';

// Tuesday 13 Oct 2026, noon. Local-time helpers keep the tests valid in any time zone.
const NOW = new Date(2026, 9, 13, 12, 0);
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  Math.floor(new Date(y, m - 1, d, h, min).getTime() / 1000);
const ev = (md5: string, page: number, startTime: number, duration = 60): StatEventRow => ({
  md5,
  title: md5.toUpperCase(),
  authors: 'A',
  page,
  startTime,
  duration,
  totalPages: 300,
});

describe('periods', () => {
  it('week: seven days ending today, labelled "last 7 days"', () => {
    const info = periodInfo('week', currentAnchor(NOW), NOW, 2026);
    expect(info.label).toBe('last 7 days');
    expect(info.pagerLabel).toBe('7 – 13 Oct');
    expect(info.labels).toEqual(['W', 'T', 'F', 'S', 'S', 'M', 'T']);
    expect(info.curIdx).toBe(6);
    expect(info.isCurrent).toBe(true);
  });

  it('week range label crosses months and years', () => {
    expect(weekRangeLabel(new Date(2026, 0, 3))).toBe('28 Dec – 3 Jan 2026');
    expect(weekRangeLabel(new Date(2026, 9, 3))).toBe('27 Sep – 3 Oct');
  });

  it('month and year have one bar per day / month, all time at least two years', () => {
    expect(periodInfo('month', currentAnchor(NOW), NOW, 2026).count).toBe(31);
    expect(periodInfo('month', currentAnchor(NOW), NOW, 2026).curIdx).toBe(12);
    expect(periodInfo('year', currentAnchor(NOW), NOW, 2026).count).toBe(12);
    const all = periodInfo('all', currentAnchor(NOW), NOW, 2026);
    expect(all.labels).toEqual(['2025', '2026']);
    expect(periodInfo('all', currentAnchor(NOW), NOW, 2023).labels).toEqual(['2023', '2024', '2025', '2026']);
  });

  it('shifting never goes past the current period', () => {
    const a = currentAnchor(NOW);
    expect(shiftAnchor('week', a, 1, NOW).weekEnd.getDate()).toBe(13);
    const prev = shiftAnchor('week', a, -1, NOW);
    expect(prev.weekEnd.getDate()).toBe(6);
    expect(shiftAnchor('week', prev, 1, NOW).weekEnd.getDate()).toBe(13);
    expect(shiftAnchor('month', a, -1, NOW).month).toEqual({ y: 2026, m: 8 });
    expect(shiftAnchor('month', { ...a, month: { y: 2026, m: 0 } }, -1, NOW).month).toEqual({ y: 2025, m: 11 });
    expect(shiftAnchor('month', a, 1, NOW).month).toEqual({ y: 2026, m: 9 });
    expect(shiftAnchor('year', a, 1, NOW).year).toBe(2026);
    expect(shiftAnchor('year', a, -1, NOW).year).toBe(2025);
  });

  it('first reading year', () => {
    expect(firstReadingYear([], NOW)).toBe(2026);
    expect(firstReadingYear([ev('a', 1, at(2023, 5, 1))], NOW)).toBe(2023);
  });
});

describe('periodData', () => {
  const events = [
    ev('a', 1, at(2026, 10, 13, 9), 100),
    ev('a', 2, at(2026, 10, 13, 9, 3), 100),
    ev('a', 2, at(2026, 10, 13, 20), 100), // same page again, another visit
    ev('a', 3, at(2026, 10, 7, 21), 60),
    ev('a', 4, at(2026, 10, 6, 21), 60), // outside the 7-day window (6 Oct)
    ev('b', 1, at(2025, 3, 3), 60),
  ];

  it('week buckets seconds and distinct pages per day', () => {
    const d = periodData(events, periodInfo('week', currentAnchor(NOW), NOW, 2025), NOW);
    expect(d.seconds).toEqual([60, 0, 0, 0, 0, 0, 300]);
    expect(d.pages).toEqual([1, 0, 0, 0, 0, 0, 2]);
    expect(d.totalSeconds).toBe(360);
    expect(d.totalPages).toBe(3);
  });

  it('month leaves future days empty (null)', () => {
    const d = periodData(events, periodInfo('month', currentAnchor(NOW), NOW, 2025), NOW);
    expect(d.seconds).toHaveLength(31);
    expect(d.seconds[12]).toBe(300);
    expect(d.seconds[13]).toBeNull();
    expect(d.seconds[5]).toBe(60);
  });

  it('year and all time', () => {
    const y = periodData(events, periodInfo('year', currentAnchor(NOW), NOW, 2025), NOW);
    expect(y.seconds[9]).toBe(420);
    expect(y.seconds[10]).toBeNull();
    const all = periodData(events, periodInfo('all', currentAnchor(NOW), NOW, 2025), NOW);
    expect(all.info.labels).toEqual(['2025', '2026']);
    expect(all.seconds).toEqual([60, 420]);
  });

  it('a past week is not "current" and has its own totals', () => {
    const anchor = shiftAnchor('week', currentAnchor(NOW), -1, NOW);
    const d = periodData(events, periodInfo('week', anchor, NOW, 2025), NOW);
    expect(d.info.isCurrent).toBe(false);
    expect(d.info.curIdx).toBe(-1);
    expect(d.info.label).toBe('30 Sep – 6 Oct');
    expect(d.totalSeconds).toBe(60); // only the 6 Oct visit
  });

  it('pctDelta', () => {
    expect(pctDelta(120, 100)).toBe(20);
    expect(pctDelta(50, 100)).toBe(-50);
    expect(pctDelta(5, 0)).toBeNull();
  });
});

describe('details', () => {
  it('pace, longest session, best day, average a day', () => {
    const events = [
      // Sat 10 Oct evening: 40 pages in one 40-minute session (20 x 120 s)
      ...Array.from({ length: 20 }, (_, i) => ev('a', i + 1, at(2026, 10, 10, 19, i * 2), 120)),
      // Mon 12 Oct: one short session
      ev('b', 1, at(2026, 10, 12, 8), 60),
    ];
    const data = periodData(events, periodInfo('week', currentAnchor(NOW), NOW, 2026), NOW);
    const d = computeDetails(data, NOW);
    expect(d.sessions).toBe(2);
    expect(d.longest!.seconds).toBe(2400);
    expect(sessionWhen('week', d.longest!)).toBe('Saturday evening');
    expect(sessionWhen('month', d.longest!)).toBe('Sat 10 Oct');
    expect(sessionWhen('all', d.longest!)).toBe('10 Oct 2026');
    expect(d.bestDay!.seconds).toBe(2400);
    expect(d.bestDay!.date.getDate()).toBe(10);
    expect(d.avgPerDaySeconds).toBe(Math.round(2460 / 7));
    expect(d.pace).toBe(Math.round((21 / 2460) * 3600));
  });

  it('average a day only counts days that have passed in the month', () => {
    const data = periodData([ev('a', 1, at(2026, 10, 1), 120)], periodInfo('month', currentAnchor(NOW), NOW, 2026), NOW);
    expect(computeDetails(data, NOW).avgPerDaySeconds).toBe(Math.round(120 / 13));
  });

  it('empty period', () => {
    const data = periodData([], periodInfo('week', currentAnchor(NOW), NOW, 2026), NOW);
    const d = computeDetails(data, NOW);
    expect(d.longest).toBeNull();
    expect(d.bestDay).toBeNull();
    expect(d.sessions).toBe(0);
  });
});

describe('goalWeek', () => {
  it('marks the days that met the goal, today last', () => {
    const byDay = secondsByDay([
      ev('a', 1, at(2026, 10, 8), 120),
      ...Array.from({ length: 15 }, (_, i) => ev('a', i, at(2026, 10, 8, 10, i * 3), 120)),
      ev('a', 1, at(2026, 10, 13, 9), 60),
    ]);
    const week = goalWeek(byDay, 30, NOW);
    expect(week).toHaveLength(7);
    expect(week.map((d) => d.initial).join('')).toBe('WTFSSMT');
    expect(week.filter((d) => d.met).map((d) => d.key)).toEqual(['2026-10-08']);
    expect(week[6]!.isToday).toBe(true);
    expect(week[6]!.met).toBe(false);
  });
});

describe('readingPatterns', () => {
  // 4 evening sessions on weekdays (Mon 5, Tue 6 twice, Wed 7 Oct), 1 morning session on Sat 10 Oct.
  const events = [
    ev('a', 1, at(2026, 10, 5, 19), 60),
    ev('a', 2, at(2026, 10, 6, 19, 30), 60),
    ev('a', 3, at(2026, 10, 6, 21), 60),
    ev('a', 4, at(2026, 10, 7, 20), 60),
    ev('b', 1, at(2026, 10, 10, 8), 60),
    ev('c', 1, at(2025, 1, 1, 8), 60), // older than 90 days
  ];

  it('sessions: evening wins, on weekdays', () => {
    const p = readingPatterns(events, 'sessions', NOW);
    expect(p.total).toBe(5);
    expect(p.topTime).toEqual({ name: 'Evening', value: 4 });
    expect(p.peakHour).toBe(19);
    expect(p.byHour[19]).toBe(2);
    expect(p.byWeekday[0]).toEqual({ name: 'Monday', value: 1 });
    expect(p.topWeekday.name).toBe('Tuesday');
    expect(p.weekPart).toBe('weekdays');
  });

  it('pages: counts distinct pages per day', () => {
    const p = readingPatterns(events, 'pages', NOW);
    expect(p.total).toBe(5);
    expect(p.topTime).toEqual({ name: 'Evening', value: 4 });
    expect(p.topWeekday).toEqual({ name: 'Tuesday', value: 2 });
  });

  it('nothing recent', () => {
    expect(readingPatterns([], 'sessions', NOW).total).toBe(0);
  });
});

describe('sessions screen', () => {
  const events = [
    ev('a', 10, at(2026, 10, 13, 8, 41), 60),
    ev('a', 11, at(2026, 10, 13, 8, 43), 60),
    ev('a', 11, at(2026, 10, 13, 8, 45), 60),
    ev('b', 5, at(2026, 9, 30, 21), 60),
    ev('b', 5, at(2025, 12, 30, 21), 60),
  ];

  it('years newest first, months newest first', () => {
    expect(sessionYears(events)).toEqual([2026, 2025]);
    const months = monthsOfYear(events, 2026);
    expect(months.map((m) => m.name)).toEqual(['October', 'September']);
    expect(months[0]!.sessions).toHaveLength(1);
    expect(months[0]!.pages).toBe(2);
  });

  it('session text', () => {
    const s = monthsOfYear(events, 2026)[0]!.sessions[0]!;
    expect(s.pages).toBe(2);
    expect(sessionPagesText(s)).toBe('Pages 10–11 · 2 pages');
    const one = monthsOfYear(events, 2026)[1]!.sessions[0]!;
    expect(sessionPagesText(one)).toBe('Page 5 · 1 page');
  });
});
