// Paperback reading goals — personal, device-local (not synced).

export interface Goals {
  booksPerYear: number;
  pagesPerDay: number;
  minutesPerDay: number;
  streakDays: number;
}

export const DEFAULT_GOALS: Goals = {
  booksPerYear: 24,
  pagesPerDay: 30,
  minutesPerDay: 30,
  streakDays: 30,
};

const KEY = 'paperback.goals.v1';

const sane = (v: unknown, fallback: number): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : fallback;
};

export function normalizeGoals(raw: Partial<Record<keyof Goals, unknown>> | null | undefined): Goals {
  return {
    booksPerYear: sane(raw?.booksPerYear, DEFAULT_GOALS.booksPerYear),
    pagesPerDay: sane(raw?.pagesPerDay, DEFAULT_GOALS.pagesPerDay),
    minutesPerDay: sane(raw?.minutesPerDay, DEFAULT_GOALS.minutesPerDay),
    streakDays: sane(raw?.streakDays, DEFAULT_GOALS.streakDays),
  };
}

export function loadGoals(): Goals {
  try {
    const text = localStorage.getItem(KEY);
    return normalizeGoals(text ? JSON.parse(text) : null);
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

export function saveGoals(goals: Goals): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeGoals(goals)));
  } catch {
    // storage unavailable: goals just won't persist
  }
}
