'use client';

import { useMemo } from 'react';
import { useStatsData } from '@/app/stats/useStatsData';
import { lastReadMap, recentPace } from '@/services/paperback/libraryViews';

/** Library + reading events + the few derived values most screens need. */
export function usePaperbackData() {
  const data = useStatsData();
  const events = useMemo(() => data.events ?? [], [data.events]);
  const lastRead = useMemo(() => lastReadMap(events), [events]);
  const pace = useMemo(() => recentPace(events, data.now), [events, data.now]);
  return { ...data, events, loaded: data.events !== null, lastRead, pace };
}
