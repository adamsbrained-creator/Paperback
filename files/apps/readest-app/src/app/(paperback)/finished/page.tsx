'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { useAppRouter } from '@/components/paperback/platform';
import { useShelves } from '@/components/paperback/useShelves';
import { Pills, Thumb } from '@/app/stats/components/ui';
import { finishedBooks, finishedYear, finishedYears } from '@/services/paperback/libraryViews';

export default function FinishedPage() {
  const router = useAppRouter();
  const { library, booksByHash, now, loaded } = usePaperbackData();
  const [picked, setPicked] = useState<number | null>(null);
  const [shelves] = useShelves();

  const years = useMemo(() => finishedYears(library, now), [library, now]);
  const year = picked ?? years[0] ?? now.getFullYear();
  const books = useMemo(
    () => finishedBooks(library).filter((b) => finishedYear(b) === year),
    [library, year],
  );

  return (
    <Shell title='Finished'>
      <div className='pb-stack'>
        <Pills
          options={years.map((y) => ({ id: String(y), label: String(y) }))}
          value={String(year)}
          onChange={(id) => setPicked(Number(id))}
        />
        {loaded && books.length === 0 && (
          <div className='pb-empty'>No finished books in {year}.</div>
        )}
        <div className='pb-cover-grid'>
          {books.map((b) => (
            <button key={b.hash} className='pb-cover-cell' onClick={() => router.push(`/book?hash=${b.hash}`)}>
              <Thumb md5={b.hash} book={booksByHash.get(b.hash)} size='fill' />
              <div className='pb-label pb-ellipsis'>{b.title}</div>
              {shelves.ratings[b.hash] ? (
                <div className='pb-label' style={{ marginTop: 2, color: '#e9b949' }}>
                  {'★'.repeat(shelves.ratings[b.hash]!)}
                  {'☆'.repeat(5 - shelves.ratings[b.hash]!)}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
