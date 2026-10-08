'use client';

import { useMemo } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import BookRow from '@/components/paperback/BookRow';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { useShelves } from '@/components/paperback/useShelves';
import { resolveCollection, toggleFavorite } from '@/services/paperback/shelves';

export default function FavoritesPage() {
  const router = useAppRouter();
  const { library, now, loaded } = usePaperbackData();
  const [shelves, update, ready] = useShelves();
  const books = useMemo(
    () => resolveCollection('fav', library, shelves, now)?.books ?? [],
    [library, shelves, now],
  );

  return (
    <Shell title='Favorites'>
      <div className='pb-stack'>
        {loaded && ready && books.length === 0 && (
          <div className='pb-empty'>No favorites yet. Tap ♥ on a book&apos;s details page.</div>
        )}
        {books.map((b) => (
          <BookRow
            key={b.hash}
            book={b}
            onOpen={() => router.push(`/book?hash=${b.hash}`)}
            trailing={
              <button
                className='pb-iconbtn on'
                aria-label='Remove from favorites'
                onClick={() => update((s) => toggleFavorite(s, b.hash))}
              >
                ♥
              </button>
            }
          />
        ))}
      </div>
    </Shell>
  );
}
