'use client';

import { useMemo, useState } from 'react';
import {
  buildSessions,
  formatClock,
  groupSessionsByDay,
  type StatEventRow,
} from '@/services/statistics/statsAggregate';

const PAGE_SIZE = 40;

export default function HistoryView({ events, now }: { events: StatEventRow[]; now: Date }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sessions = useMemo(
    () => buildSessions(events).sort((a, b) => b.start - a.start),
    [events],
  );
  const days = useMemo(() => groupSessionsByDay(sessions.slice(0, limit), now), [sessions, limit, now]);

  if (sessions.length === 0) {
    return <div className='pb-empty'>No reading sessions yet.</div>;
  }

  return (
    <div className='pb-stack'>
      {days.map((day) => (
        <div key={day.key} className='pb-stack'>
          <div className='pb-sec'>{day.label}</div>
          {day.sessions.map((s) => {
            const mins = Math.round(s.seconds / 60);
            const pages = s.pageFrom === s.pageTo ? `p. ${s.pageFrom}` : `pp. ${s.pageFrom}–${s.pageTo}`;
            return (
              <div key={`${s.md5}-${s.start}`} className='pb-sess'>
                <div className='pb-time'>{formatClock(s.start)}</div>
                <div className='pb-card pb-grow' style={{ padding: '12px 16px', borderRadius: 24 }}>
                  <div className='pb-title pb-ellipsis'>{s.title}</div>
                  <div className='pb-label'>
                    {mins < 1 ? '<1 min' : `${mins} min`} · {pages}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {sessions.length > limit && (
        <button className='pb-btn ghost' onClick={() => setLimit(limit + PAGE_SIZE)}>
          Show more
        </button>
      )}
    </div>
  );
}
