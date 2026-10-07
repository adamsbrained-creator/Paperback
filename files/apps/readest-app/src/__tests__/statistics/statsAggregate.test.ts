import { describe, it, expect } from 'vitest';
import {
  booksPace,
  buildBars,
  buildHeatmap,
  buildSessions,
  computeStreaks,
  computeSummary,
  eventsInRange,
  rollingStats,
  formatDuration,
  groupSessionsByDay,
  hourDistribution,
  secondsByDay,
  topBooks,
  type StatEventRow,
} from '@/services/statistics/statsAggregate';

// Local-time helper so the tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  Math.floor(new Date(y, m - 1, d, h, min).getTime() / 1000);

const ev = (md5: string, page: number, startTime: number, duration: number): StatEventRow => ({
  md5,
  title: md5.toUpperCase(),
  authors: 'A',
  page,
  startTime,
  duration,
  totalPages: 300,
});

// Thursday 8 Oct 2026, 20:00 local.
const NOW = new Date(2026, 9, 8, 20, 0);

describe('summary', () => {
  it('sums time and counts distinct pages and books', () => {
    const s = computeSummary([
      ev('a', 1, at(2026, 10, 8, 9, 0), 60),
      ev('a', 1, at(2026, 10, 8, 9, 5), 30), // same page again: time counts, page does not
      ev('b', 7, at(2026, 10, 8, 9, 6), 90),
    ]);
    expect(s.seconds).toBe(180);
    expect(s.pages).toBe(2);
    expect(s.books).toBe(2);
  });

  it('caps a forgotten page at 120 s', () => {
    expect(computeSummary([ev('a', 1, at(2026, 10, 8), 5000)]).seconds).toBe(120);
  });
});

describe('sessions', () => {
  it('merges close events of one book and splits on gaps or other books', () => {
    const sessions = buildSessions([
      ev('a', 10, at(2026, 10, 8, 9, 0), 60),
      ev('a', 11, at(2026, 10, 8, 9, 2), 60),
      ev('a', 12, at(2026, 10, 8, 10, 0), 60), // > 10 min gap
      ev('b', 1, at(2026, 10, 8, 10, 1), 60),
    ]);
    expect(sessions).toHaveLength(3);
    expect(sessions[0]!.pageFrom).toBe(10);
    expect(sessions[0]!.pageTo).toBe(11);
    expect(sessions[0]!.seconds).toBe(120);
  });

  it('groups by day with friendly labels', () => {
    const days = groupSessionsByDay(
      buildSessions([
        ev('a', 1, at(2026, 10, 8, 9), 60),
        ev('a', 1, at(2026, 10, 7, 9), 60),
        ev('a', 1, at(2026, 9, 30, 9), 60),
      ]),
      NOW,
    );
    expect(days.map((d) => d.label)).toEqual(['TODAY', 'YESTERDAY', 'SEP 30']);
  });
});

describe('bars', () => {
  it('week has 7 Monday-first bars and marks the top day', () => {
    const events = [
      ev('a', 1, at(2026, 10, 5), 60), // Mon
      ev('a', 2, at(2026, 10, 8, 9), 60), // Thu
      ev('a', 3, at(2026, 10, 8, 10), 60), // Thu
      ev('a', 4, at(2026, 10, 1), 60), // previous week: ignored
    ];
    const bars = buildBars(events, 'week', NOW);
    expect(bars).toHaveLength(7);
    expect(bars[0]!.pages).toBe(1);
    expect(bars[3]!.pages).toBe(2);
    expect(bars[3]!.isTop).toBe(true);
    expect(bars.filter((b) => b.isTop)).toHaveLength(1);
  });

  it('year has 12 month bars, month has one per day', () => {
    expect(buildBars([], 'year', NOW)).toHaveLength(12);
    expect(buildBars([], 'month', NOW)).toHaveLength(31);
    expect(eventsInRange([ev('a', 1, at(2026, 1, 2), 60)], 'year', NOW)).toHaveLength(1);
    expect(eventsInRange([ev('a', 1, at(2025, 12, 31), 60)], 'year', NOW)).toHaveLength(0);
  });
});

describe('streaks', () => {
  const day = (d: number, m = 10) => ev('a', d, at(2026, m, d), 120);

  it('counts consecutive days ending today', () => {
    const by = secondsByDay([day(6), day(7), day(8)]);
    expect(computeStreaks(by, NOW)).toEqual({ current: 3, longest: 3 });
  });

  it('an empty today does not break yesterday\'s streak', () => {
    const by = secondsByDay([day(5), day(6), day(7)]);
    expect(computeStreaks(by, NOW).current).toBe(3);
  });

  it('breaks after a missed day and keeps the longest run', () => {
    // Read 1-4 and yesterday (7): the run ending yesterday is 1 long.
    const by = secondsByDay([day(1), day(2), day(3), day(4), day(7)]);
    expect(computeStreaks(by, NOW)).toEqual({ current: 1, longest: 4 });
    // Nothing since the 4th: the streak is gone.
    const old = secondsByDay([day(1), day(2), day(3), day(4)]);
    expect(computeStreaks(old, NOW)).toEqual({ current: 0, longest: 4 });
  });

  it('ignores days under a minute', () => {
    const by = secondsByDay([ev('a', 1, at(2026, 10, 8), 20)]);
    expect(computeStreaks(by, NOW).current).toBe(0);
  });
});

describe('heatmap, hours, top books, pace, format', () => {
  it('heatmap is weeks x 7 with the current week last', () => {
    const grid = buildHeatmap(secondsByDay([ev('a', 1, at(2026, 10, 8), 120)]), NOW, 10);
    expect(grid).toHaveLength(10);
    expect(grid[0]).toHaveLength(7);
    const thursday = grid[9]![3]!;
    expect(thursday.key).toBe('2026-10-08');
    expect(thursday.level).toBe(1);
    expect(grid[9]![4]!.inFuture).toBe(true);
  });

  it('hour distribution buckets by local start hour', () => {
    const h = hourDistribution([ev('a', 1, at(2026, 10, 8, 21, 30), 90)]);
    expect(h[21]).toBe(90);
    expect(h.reduce((a, b) => a + b, 0)).toBe(90);
  });

  it('top books are ranked with shares', () => {
    const top = topBooks([
      ev('a', 1, at(2026, 10, 8, 9), 30),
      ev('b', 1, at(2026, 10, 8, 10), 90),
    ]);
    expect(top[0]!.md5).toBe('b');
    expect(top[0]!.share).toBeCloseTo(0.75);
  });

  it('books pace', () => {
    const p = booksPace(12, 24, new Date(2026, 6, 2)); // ~half the year
    expect(p.delta).toBeGreaterThanOrEqual(0);
    expect(p.label).toBe('12 to go · on pace');
    expect(booksPace(0, 24, new Date(2026, 6, 2)).label).toContain('behind');
  });

  it('formats durations', () => {
    expect(formatDuration(42 * 60)).toBe('42m');
    expect(formatDuration(65 * 60)).toBe('1h 05m');
    expect(formatDuration(112 * 3600)).toBe('112h');
  });
});

describe('rolling stats (Stats screen)', () => {
  // NOW = Thu 8 Oct 2026. Week window = Fri 2 Oct .. Thu 8 Oct, previous = Fri 25 Sep .. Thu 1 Oct.
  it('week: seven bars ending today, weekday initials, comparison with the week before', () => {
    const events = [
      ev('a', 1, at(2026, 10, 8, 9), 60), // today
      ev('a', 2, at(2026, 10, 2, 9), 120), // first day of the window (Fri)
      ev('a', 3, at(2026, 10, 1, 9), 60), // previous window
      ev('a', 4, at(2026, 9, 25, 9), 60), // previous window (first day)
      ev('a', 5, at(2026, 9, 24, 9), 60), // too old: in neither
    ];
    const r = rollingStats(events, 'week', NOW);
    expect(r.bars.map((b) => b.label).join('')).toBe('FSSMTWT');
    expect(r.bars[6]!.isCurrent).toBe(true);
    expect(r.bars[6]!.seconds).toBe(60);
    expect(r.bars[0]!.seconds).toBe(120);
    expect(r.seconds).toBe(180);
    expect(r.pages).toBe(2);
    expect(r.previousSeconds).toBe(120);
    expect(r.deltaPct).toBe(50);
    expect(r.windowLabel).toBe('7 days');
  });

  it('delta is null with no history, negative when you read less', () => {
    expect(rollingStats([ev('a', 1, at(2026, 10, 8), 60)], 'week', NOW).deltaPct).toBe(null);
    const less = rollingStats([ev('a', 1, at(2026, 10, 8), 60), ev('a', 2, at(2026, 10, 1), 120)], 'week', NOW);
    expect(less.deltaPct).toBe(-50);
  });

  it('month: 30 daily bars; year: 12 monthly bars ending this month', () => {
    const m = rollingStats([ev('a', 1, at(2026, 9, 9, 10), 60)], 'month', NOW);
    expect(m.bars).toHaveLength(30);
    expect(m.bars[0]!.seconds).toBe(60); // 9 Sep is 29 days before 8 Oct
    const y = rollingStats(
      [ev('a', 1, at(2026, 10, 3), 60), ev('a', 2, at(2025, 11, 3), 120), ev('a', 3, at(2025, 10, 3), 30)],
      'year',
      NOW,
    );
    expect(y.bars).toHaveLength(12);
    expect(y.bars[11]!.isCurrent).toBe(true);
    expect(y.bars[11]!.seconds).toBe(60);
    expect(y.bars[0]!.seconds).toBe(120); // Nov 2025
    expect(y.previousSeconds).toBe(30); // Oct 2025 is the month before the window
    expect(y.bars[11]!.label).toBe('O');
  });
});
