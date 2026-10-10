'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { PiMagnifyingGlass } from 'react-icons/pi';
import type { PBook } from '@/services/paperback/library';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import AppHeader from '@/components/paperback/AppHeader';
import BentoView from '@/components/paperback/BentoView';
import BookRow from '@/components/paperback/BookRow';
import { useBooknotes } from '@/components/paperback/useBooknotes';
import { useLongPress } from '@/components/paperback/useLongPress';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { Thumb } from '@/app/stats/components/ui';
import {
  filterLibrary,
  shelfSections,
  sortRecent,
  statusLabel,
  type BookStatus,
  type LibraryFilter,
} from '@/services/paperback/libraryViews';

type View = 'shelf' | 'grid' | 'list' | 'stacks' | 'bento';
const VIEW_KEY = 'paperback.library.view';
const VIEWS: { id: View; label: string }[] = [
  { id: 'shelf', label: 'Shelf' },
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
  { id: 'stacks', label: 'Stacks' },
  { id: 'bento', label: 'Bento' },
];
const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'finished', label: 'Finished' },
  { id: 'want', label: 'Want to read' },
];
const SHELVES: { id: BookStatus; label: string }[] = [
  { id: 'reading', label: 'Reading' },
  { id: 'finished', label: 'Finished' },
  { id: 'want', label: 'Want to read' },
];
const SHELF_HEIGHTS = [150, 126, 138, 118, 144];
const PAGE = 60;
const SHELF_MAX = 12;

/** Tap opens the book; press and hold opens its details. */
function PressableCover({
  book,
  onOpen,
  onDetails,
  children,
  className,
  style,
}: {
  book: PBook;
  onOpen: (b: PBook) => void;
  onDetails: (b: PBook) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const handlers = useLongPress(
    () => onOpen(book),
    () => onDetails(book),
  );
  return (
    <button className={className} style={style} aria-label={`Open ${book.title}`} {...handlers}>
      {children}
    </button>
  );
}

export default function BooksPage() {
  const router = useAppRouter();
  const openBook = usePaperbackOpenBook();
  const { library, lastRead, loaded } = usePaperbackData();
  const [view, setView] = useState<View>('grid');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === 'shelf' || v === 'grid' || v === 'list' || v === 'stacks' || v === 'bento') setView(v);
    } catch {
      /* keep default */
    }
  }, []);
  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* not persisted */
    }
  };

  const all = useMemo(() => sortRecent(library, lastRead), [library, lastRead]);
  const shown = useMemo(() => filterLibrary(all, filter, query), [all, filter, query]);
  const sections = useMemo(() => shelfSections(shown), [shown]);
  const details = (b: PBook) => router.push(`/book?hash=${b.hash}`);
  const bentoBooks = useMemo(() => shown.slice(0, 8), [shown]);
  const bentoNotes = useBooknotes(bentoBooks, view === 'bento');
  const shelfCount = SHELVES.filter((s) => sections[s.id].length > 0).length;

  return (
    <Shell title='Library' tab='library' header={<AppHeader right='add' />}>
      <div className='pb-libhead'>
        <h1 className='pb-bigtitle pb-serif'>Library</h1>
        <span className='pb-label'>
          {all.length} {all.length === 1 ? 'book' : 'books'}
          {(view === 'shelf' || view === 'stacks') && shelfCount ? ` · ${shelfCount} ${shelfCount === 1 ? 'shelf' : 'shelves'}` : ''}
        </span>
      </div>

      <div className='pb-stack'>
        <div className='pb-search'>
          <PiMagnifyingGlass size={22} />
          <input
            value={query}
            onChange={(e) => (setQuery(e.target.value), setLimit(PAGE))}
            placeholder='Search library'
            spellCheck={false}
          />
          {query && (
            <button className='pb-clear' onClick={() => setQuery('')}>
              Clear
            </button>
          )}
        </div>

        <div className='pb-seg' role='tablist' aria-label='View'>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role='tab'
              aria-selected={view === v.id}
              className={clsx(view === v.id && 'on')}
              onClick={() => pickView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className='pb-pills pb-scrollx'>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={clsx('pb-pill', filter === f.id && 'on')}
              onClick={() => (setFilter(f.id), setLimit(PAGE))}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loaded && shown.length === 0 && (
          <div className='pb-empty'>
            {all.length === 0 ? 'Your library is empty. Tap + to add books.' : 'No books match.'}
          </div>
        )}

        {view === 'grid' && shown.length > 0 && (
          <>
            <div className='pb-sec' style={{ textTransform: 'none', letterSpacing: 0, fontSize: 15 }}>
              {query || filter !== 'all' ? `${shown.length} found` : 'Recently read'}
            </div>
            <div className='pb-bookgrid'>
              {shown.slice(0, limit).map((b) => (
                <PressableCover key={b.hash} className='pb-gridcell' book={b} onOpen={openBook} onDetails={details}>
                  <Thumb md5={b.hash} book={b} size='fill' />
                  <div className='pb-cell-title pb-ellipsis'>{b.title}</div>
                  <div className='pb-label'>{statusLabel(b)}</div>
                </PressableCover>
              ))}
            </div>
          </>
        )}

        {view === 'list' &&
          shown.slice(0, limit).map((b) => (
            <BookRow
              key={b.hash}
              book={b}
              sub={`${b.author ? `${b.author} · ` : ''}${statusLabel(b)}`}
              onOpen={() => openBook(b)}
              trailing={
                <button className='pb-iconbtn' aria-label={`Details of ${b.title}`} onClick={() => details(b)}>
                  ⓘ
                </button>
              }
            />
          ))}

        {view === 'shelf' &&
          SHELVES.filter((s) => sections[s.id].length > 0).map((s) => {
            const list = sections[s.id];
            return (
              <div key={s.id} className='pb-shelfblock'>
                <div className='pb-shelfhead'>
                  <h2 className='pb-serif'>{s.label}</h2>
                  <span className='pb-label'>{list.length}</span>
                </div>
                <div className='pb-shelf'>
                  {list.slice(0, SHELF_MAX).map((b, i) => {
                    const h = SHELF_HEIGHTS[i % SHELF_HEIGHTS.length]!;
                    return (
                      <PressableCover
                        key={b.hash}
                        className='pb-shelfbook'
                        style={{ height: h, width: Math.round((h * 2) / 3) }}
                        book={b}
                        onOpen={openBook}
                        onDetails={details}
                      >
                        <Thumb md5={b.hash} book={b} size='fill' />
                      </PressableCover>
                    );
                  })}
                  {list.length > SHELF_MAX && (
                    <button
                      className='pb-shelfmore'
                      onClick={() => (setFilter(s.id === 'want' ? 'want' : s.id), pickView('grid'))}
                    >
                      +{list.length - SHELF_MAX}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {view === 'bento' && shown.length > 0 && (
          <BentoView
            books={shown}
            notes={bentoNotes}
            open={openBook}
            onStack={() => pickView('grid')}
            onNotes={() => router.push('/notes')}
          />
        )}

        {view === 'stacks' &&
          SHELVES.filter((s) => sections[s.id].length > 0).map((s) => {
            const list = sections[s.id];
            return (
              <button
                key={s.id}
                className='pb-stackblock'
                aria-label={`Show ${s.label}`}
                onClick={() => (setFilter(s.id), pickView('grid'))}
              >
                <div className='pb-fanrow'>
                  {list.slice(0, 3).map((b, i) => (
                    <div
                      key={b.hash}
                      className='pb-fancover'
                      style={{ transform: `rotate(${[-2, 1, -1][i] ?? 0}deg)`, zIndex: i + 1 }}
                    >
                      <Thumb md5={b.hash} book={b} size='fill' />
                    </div>
                  ))}
                  {list.length > 3 && <div className='pb-fanmore'>+{list.length - 3}</div>}
                </div>
                <h2 className='pb-serif'>{s.label}</h2>
                <div className='pb-label'>
                  {list.length} {list.length === 1 ? 'book' : 'books'}
                </div>
              </button>
            );
          })}

        {(view === 'grid' || view === 'list') && shown.length > limit && (
          <button className='pb-btn ghost' onClick={() => setLimit(limit + PAGE)}>
            Show more
          </button>
        )}
      </div>
    </Shell>
  );
}
