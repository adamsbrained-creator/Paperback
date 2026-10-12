'use client';

import { useMemo } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { authorRows } from '@/services/paperback/libraryViews';

export default function AuthorsPage() {
  const router = useAppRouter();
  const { library, loaded } = usePaperbackData();
  const authors = useMemo(() => authorRows(library), [library]);

  return (
    <Shell title='Authors' pageHeader>
      <div className='pb-stack'>
        {loaded && authors.length === 0 && <div className='pb-empty'>No books yet.</div>}
        {authors.map((a, i) => (
          <button
            key={a.name}
            className='pb-row pb-rowbtn'
            onClick={() => router.push(`/books?view=all&q=${encodeURIComponent(a.name)}`)}
          >
            <div className={`pb-avatar a${i % 6}`}>{a.initials}</div>
            <div className='pb-grow'>
              <div className='pb-title pb-ellipsis'>{a.name}</div>
              <div className='pb-label'>
                {a.count} {a.count === 1 ? 'book' : 'books'} in library
              </div>
            </div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
