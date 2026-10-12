'use client';

import { useMemo } from 'react';
import { BookmarkIcon } from '@/components/paperback/icons';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useBooknotes } from '@/components/paperback/useBooknotes';
import { liveBooks } from '@/services/paperback/libraryViews';
import { dayLabel, groupBookmarks } from '@/services/paperback/notesViews';

export default function BookmarksPage() {
  const openBook = usePaperbackOpenBook();
  const { library, libraryLoaded, booksByHash, now } = usePaperbackData();
  const books = useMemo(() => liveBooks(library), [library]);
  const rows = useBooknotes(books, libraryLoaded);
  const groups = useMemo(() => groupBookmarks(rows ?? []), [rows]);

  return (
    <Shell title='Bookmarks'>
      <div className='pb-stack'>
        {rows === null && <div className='pb-empty'>Loading…</div>}
        {rows !== null && groups.length === 0 && (
          <div className='pb-empty'>No bookmarks yet. Tap the bookmark icon while reading.</div>
        )}
        {groups.map((g) => (
          <div key={g.bookHash} className='pb-stack'>
            <div className='pb-sec'>{g.bookTitle}</div>
            {g.bookmarks.map((b) => {
              const book = booksByHash.get(b.bookHash);
              return (
                <button
                  key={b.key}
                  className='pb-row pb-rowbtn'
                  disabled={!book}
                  onClick={() => book && openBook(book, b.cfi)}
                >
                  <div className='pb-bmicon'>
                    <BookmarkIcon size={22} />
                  </div>
                  <div className='pb-grow'>
                    <div className='pb-title pb-ellipsis'>{b.text || b.note || 'Bookmark'}</div>
                    {b.page ? <div className='pb-label'>p. {b.page}</div> : null}
                  </div>
                  <div className='pb-label'>{dayLabel(b.at, now)}</div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Shell>
  );
}
