'use client';

import { useMemo, useState } from 'react';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { useAppRouter } from '@/components/paperback/platform';
import { navigateToLibrary } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useBooknotes } from '@/components/paperback/useBooknotes';
import { Pills, Thumb } from '@/app/stats/components/ui';
import { liveBooks } from '@/services/paperback/libraryViews';
import { searchBooks, searchNotes, snippet, splitMatches } from '@/services/paperback/notesViews';

type Scope = 'all' | 'titles' | 'notes';
const SCOPES: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'titles', label: 'Titles' },
  { id: 'notes', label: 'Notes' },
];

export default function SearchPage() {
  const router = useAppRouter();
  const openBook = usePaperbackOpenBook();
  const { library, libraryLoaded, booksByHash } = usePaperbackData();
  const books = useMemo(() => liveBooks(library), [library]);
  const rows = useBooknotes(books, libraryLoaded);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');

  const q = query.trim();
  const foundBooks = useMemo(
    () => (scope === 'notes' ? [] : searchBooks(books, q)),
    [books, q, scope],
  );
  const foundNotes = useMemo(
    () => (scope === 'titles' ? [] : searchNotes(rows ?? [], q)),
    [rows, q, scope],
  );

  return (
    <Shell title='Search'>
      <div className='pb-stack'>
        <div className='pb-search'>
          <PiMagnifyingGlass size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Titles, authors, notes'
            autoFocus
            spellCheck={false}
          />
          {query && (
            <button className='pb-clear' onClick={() => setQuery('')}>
              Clear
            </button>
          )}
        </div>
        <Pills options={SCOPES} value={scope} onChange={setScope} />

        {foundBooks.length > 0 && <div className='pb-sec'>Books · {foundBooks.length}</div>}
        {foundBooks.map((b) => (
          <button
            key={b.hash}
            className='pb-row pb-rowbtn'
            onClick={() => router.push(`/book?hash=${b.hash}`)}
          >
            <Thumb md5={b.hash} book={booksByHash.get(b.hash)} />
            <div className='pb-grow'>
              <div className='pb-title pb-ellipsis'>{b.title}</div>
              <div className='pb-label pb-ellipsis'>{b.author}</div>
            </div>
          </button>
        ))}

        {foundNotes.length > 0 && <div className='pb-sec'>In your notes · {foundNotes.length}</div>}
        {foundNotes.slice(0, 40).map((r) => {
          const book = booksByHash.get(r.bookHash);
          const body = snippet(r.note ? `${r.note} — ${r.text}` : r.text, q);
          return (
            <button
              key={r.key}
              className='pb-row pb-rowbtn'
              disabled={!book}
              onClick={() => book && openBook(book, r.cfi)}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, borderRadius: 24 }}
            >
              <div>
                {splitMatches(body, q).map((part, i) =>
                  part.hit ? (
                    <mark key={i} className='pb-mark'>
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </div>
              <div className='pb-label'>
                {r.bookTitle}
                {r.page ? ` · p. ${r.page}` : ''}
              </div>
            </button>
          );
        })}

        {q && foundBooks.length === 0 && foundNotes.length === 0 && (
          <div className='pb-empty'>{rows === null && scope !== 'titles' ? 'Searching…' : 'No matches.'}</div>
        )}

        {q && (
          <button
            className='pb-btn ghost'
            onClick={() => navigateToLibrary(router, `q=${encodeURIComponent(q)}`)}
          >
            Search inside book text (Library)
          </button>
        )}
      </div>
    </Shell>
  );
}
