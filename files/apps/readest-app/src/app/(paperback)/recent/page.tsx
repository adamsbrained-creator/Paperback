'use client';

import { useMemo } from 'react';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { Progress, Thumb } from '@/app/stats/components/ui';
import {
  lastReadAt,
  progressFraction,
  progressPercent,
  recentlyRead,
  relativeTime,
} from '@/services/paperback/libraryViews';

export default function RecentPage() {
  const openBook = usePaperbackOpenBook();
  const { library, booksByHash, lastRead, now, loaded } = usePaperbackData();
  const books = useMemo(() => recentlyRead(library, lastRead, 40), [library, lastRead]);

  return (
    <Shell title='Recently Read' pageHeader>
      <div className='pb-stack'>
        {loaded && books.length === 0 && <div className='pb-empty'>Nothing read yet.</div>}
        {books.map((b) => (
          <button key={b.hash} className='pb-row pb-rowbtn' onClick={() => openBook(b)}>
            <Thumb md5={b.hash} book={booksByHash.get(b.hash)} />
            <div className='pb-grow'>
              <div className='pb-title pb-ellipsis'>{b.title}</div>
              <div className='pb-label'>{relativeTime(lastReadAt(b, lastRead), now)}</div>
              <div style={{ marginTop: 8 }}>
                <Progress value={progressFraction(b)} />
              </div>
            </div>
            <div className='pb-label'>{progressPercent(b)}%</div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
