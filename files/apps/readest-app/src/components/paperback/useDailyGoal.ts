'use client';

import { useEffect, useState } from 'react';
import { StatisticsDb, useEnv } from '@/components/paperback/platform';
import { DEFAULT_GOALS, loadGoals } from '@/app/stats/goals';
import { dayKeyOf, secondsByDay } from '@/services/statistics/statsAggregate';

/** The minutes-per-day goal (saved on this device). */
export function useGoalMinutes() {
  const [goalMinutes, setGoalMinutes] = useState(DEFAULT_GOALS.minutesPerDay);
  useEffect(() => setGoalMinutes(loadGoals().minutesPerDay), []);
  return goalMinutes;
}

/** The minutes-per-day goal and how many seconds were read today (0 until the stats load). */
export function useDailyGoal() {
  const { appService } = useEnv();
  const goalMinutes = useGoalMinutes();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!appService) return;
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const from = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
        const db = await StatisticsDb.open(appService);
        const rows = await db.getPageEventsSince(from);
        if (!cancelled) setSeconds(secondsByDay(rows).get(dayKeyOf(now)) ?? 0);
      } catch (e) {
        console.warn('[paperback] could not load today’s reading time:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appService]);

  return { goalMinutes, seconds };
}
