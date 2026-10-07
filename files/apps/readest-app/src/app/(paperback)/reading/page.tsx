'use client';

import { useMemo } from 'react';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useShelves } from '@/components/paperback/useShelves';
import { pinnedFirst } from '@/services/paperback/shelves';
import { Progress, Thumb } from '@/app/stats/components/ui';
import {
  currentlyReading,
  progressFraction,
  progressPercent,
  timeLeftLabel,
} from '@/services/paperback/libraryViews';

export default function ReadingPage() {
  const openBook = usePaperbackOpenBook();
  const { library, booksByHash, lastRead, pace, loaded } = usePaperbackData();
  const [shelves] = useShelves();
  const books = useMemo(
    () => pinnedFirst(currentlyReading(library, lastRead), shelves.pinned),
    [library, lastRead, shelves.pinned],
  );

  return (
    <Shell title='Currently Reading'>
      <div className='pb-stack'>
        {loaded && books.length === 0 && (
          <div className='pb-empty'>No books in progress. Open one from Library to start.</div>
        )}
        {books.map((b) => {
          const left = timeLeftLabel(b, pace);
          return (
            <button key={b.hash} className='pb-row pb-rowbtn' onClick={() => openBook(b)}>
              <Thumb md5={b.hash} book={booksByHash.get(b.hash)} size='lg' />
              <div className='pb-grow'>
                <div className='pb-title pb-ellipsis' style={{ fontSize: 20 }}>
                  {b.title}
                </div>
                <div className='pb-label pb-ellipsis'>{b.author}</div>
                <div style={{ margin: '10px 0 8px' }}>
                  <Progress value={progressFraction(b)} />
                </div>
                <div className='pb-label'>
                  {progressPercent(b)}%{left ? ` · ${left}` : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
