'use client';

import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useBooknotes } from '@/components/paperback/useBooknotes';
import { Pills } from '@/app/stats/components/ui';
import { liveBooks } from '@/services/paperback/libraryViews';
import { filterNotes, newestFirst, type NoteFilter } from '@/services/paperback/notesViews';

const FILTERS: { id: NoteFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'notes', label: 'Notes' },
];
const PAGE = 40;

export default function NotesPage() {
  const openBook = usePaperbackOpenBook();
  const { library, libraryLoaded, booksByHash } = usePaperbackData();
  const books = useMemo(() => liveBooks(library), [library]);
  const rows = useBooknotes(books, libraryLoaded);
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [limit, setLimit] = useState(PAGE);
  // Book Details links here with ?book=<hash> to show one book's notes.
  const [bookFilter, setBookFilter] = useState<string | null>(null);
  useEffect(() => setBookFilter(new URLSearchParams(window.location.search).get('book')), []);

  const list = useMemo(
    () =>
      newestFirst(
        filterNotes(rows ?? [], filter).filter((r) => !bookFilter || r.bookHash === bookFilter),
      ),
    [rows, filter, bookFilter],
  );

  return (
    <Shell title='Notes & Highlights'>
      <div className='pb-stack'>
        <Pills options={FILTERS} value={filter} onChange={(f) => (setFilter(f), setLimit(PAGE))} />
        {bookFilter && (
          <div className='pb-pills'>
            <button className='pb-pill on' onClick={() => setBookFilter(null)}>
              {booksByHash.get(bookFilter)?.title ?? 'One book'} ✕
            </button>
          </div>
        )}
        {rows === null && <div className='pb-empty'>Loading…</div>}
        {rows !== null && list.length === 0 && (
          <div className='pb-empty'>
            Nothing here yet. Select text while reading to highlight it or add a note.
          </div>
        )}
        {list.slice(0, limit).map((r, i) => {
          const book = booksByHash.get(r.bookHash);
          const tilt = i % 2 === 0 ? -0.6 : 0.6;
          const where = `${r.bookTitle}${r.page ? ` · p. ${r.page}` : ''}`;
          return (
            <button
              key={r.key}
              className={r.kind === 'highlight' ? 'pb-qcard' : 'pb-qcard plain'}
              style={{
                transform: `rotate(${tilt}deg)`,
                ...(r.kind === 'highlight' ? { background: r.color } : {}),
              }}
              disabled={!book}
              onClick={() => book && openBook(book, r.cfi)}
            >
              {r.kind === 'highlight' ? (
                <div className='pb-quote'>{r.text}</div>
              ) : (
                <>
                  <div className='pb-quote small'>{r.note}</div>
                  <div className='pb-pk pb-label' style={{ marginTop: 6 }}>
                    my note
                  </div>
                  {r.text && <div className='pb-label pb-clamp2'>“{r.text}”</div>}
                </>
              )}
              <div className='pb-label pb-ellipsis' style={{ marginTop: 8, color: 'inherit', opacity: 0.65 }}>
                {where}
              </div>
            </button>
          );
        })}
        {list.length > limit && (
          <button className='pb-btn ghost' onClick={() => setLimit(limit + PAGE)}>
            Show more
          </button>
        )}
      </div>
    </Shell>
  );
}
