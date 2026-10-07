'use client';

import { useMemo } from 'react';
import { useAppRouter } from '@/hooks/useAppRouter';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { genreRows } from '@/services/paperback/shelves';

export default function GenresPage() {
  const router = useAppRouter();
  const { library, loaded } = usePaperbackData();
  const rows = useMemo(() => genreRows(library), [library]);

  return (
    <Shell title='Genres'>
      <div className='pb-stack'>
        {loaded && rows.length === 0 && (
          <div className='pb-empty'>
            No tags yet. Genres come from your book tags: in Library, open a book&apos;s details, choose
            edit and add tags such as Sci-fi or Poetry.
          </div>
        )}
        {rows.map((g) => (
          <button
            key={g.tag}
            className='pb-row pb-rowbtn'
            onClick={() => router.push(`/collection?id=${encodeURIComponent(`tag:${g.tag}`)}`)}
          >
            <div className='pb-grow'>
              <div className='pb-title'>{g.tag}</div>
            </div>
            <div className='pb-label'>{g.count}</div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
