'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BookSheet from '@/components/paperback/BookSheet';
import LibraryAll, { type LibraryLayout } from '@/components/paperback/LibraryAll';
import LibraryEmpty from '@/components/paperback/LibraryEmpty';
import LibraryShelves from '@/components/paperback/LibraryShelves';
import PageTop from '@/components/paperback/PageTop';
import { Toast, useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useImportBooks } from '@/components/paperback/useImportBooks';
import { useLibraryActions } from '@/components/paperback/useLibraryActions';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useShelves } from '@/components/paperback/useShelves';
import { liveBooks } from '@/services/paperback/libraryViews';
import type { PBook } from '@/services/paperback/library';
import {
  bookCountLabel,
  filterBooks,
  parseGridFilter,
  parseSort,
  sortBooks,
  type GridFilter,
  type SortId,
} from '@/services/paperback/libraryShelves';

type View = 'shelves' | 'all';

const SORT_KEY = 'paperback.library.sort';
const LAYOUT_KEY = 'paperback.library.layout';

/** Which screen is showing is kept in the address (?view=all&filter=reading&q=…), so Back works. */
function readUrl(): { view: View; filter: GridFilter; query: string } {
  const q = new URLSearchParams(window.location.search);
  return {
    view: q.get('view') === 'all' ? 'all' : 'shelves',
    filter: parseGridFilter(q.get('filter')),
    query: q.get('q') ?? '',
  };
}

function urlFor(view: View, filter: GridFilter, query: string): string {
  if (view === 'shelves') return '/books';
  const p = new URLSearchParams({ view: 'all' });
  if (filter !== 'all') p.set('filter', filter);
  if (query) p.set('q', query);
  return `/books?${p.toString()}`;
}

export default function LibraryPage() {
  const router = useAppRouter();
  const openBook = usePaperbackOpenBook();
  const { library, lastRead, libraryLoaded } = usePaperbackData();
  const [shelves, updateShelves] = useShelves();
  const importer = useImportBooks();
  const { setFinished, removeBook } = useLibraryActions();

  const [view, setView] = useState<View>('shelves');
  const [filter, setFilter] = useState<GridFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('recent');
  const [layout, setLayout] = useState<LibraryLayout>('grid');
  const [sheetHash, setSheetHash] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const s = readUrl();
      setView(s.view);
      setFilter(s.filter);
      setQuery(s.query);
    };
    sync();
    try {
      setSort(parseSort(localStorage.getItem(SORT_KEY)));
      setLayout(localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'grid');
    } catch {
      /* keep defaults */
    }
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const live = useMemo(() => liveBooks(library), [library]);
  const shown = useMemo(
    () => sortBooks(filterBooks(live, filter, shelves.favorites, query), sort, lastRead),
    [live, filter, shelves.favorites, query, sort, lastRead],
  );
  const sheetBook: PBook | null = useMemo(
    () => (sheetHash ? (live.find((b) => b.hash === sheetHash) ?? null) : null),
    [live, sheetHash],
  );

  const open = useCallback((b: PBook) => void openBook(b), [openBook]);
  const hold = useCallback((b: PBook) => setSheetHash(b.hash), []);

  const seeAll = (f: GridFilter) => {
    window.history.pushState({}, '', urlFor('all', f, ''));
    setView('all');
    setFilter(f);
    setQuery('');
  };
  const pickFilter = (f: GridFilter) => {
    window.history.replaceState({}, '', urlFor('all', f, query));
    setFilter(f);
  };
  const clearQuery = () => {
    window.history.replaceState({}, '', urlFor('all', filter, ''));
    setQuery('');
  };
  const pickSort = (s: SortId) => {
    setSort(s);
    try {
      localStorage.setItem(SORT_KEY, s);
    } catch {
      /* not persisted */
    }
  };
  const pickLayout = (l: LibraryLayout) => {
    setLayout(l);
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      /* not persisted */
    }
  };

  const empty = libraryLoaded && live.length === 0;
  const chip = importer.importing ? 'Importing…' : live.length > 0 ? bookCountLabel(live.length) : undefined;

  return (
    <Shell title='Library' header={<PageTop label='Library' chip={chip} />} wrapClassName='pb-set-wrap'>
      {empty ? (
        <LibraryEmpty onImport={importer.start} onDiscover={() => router.push('/discover')} importing={importer.importing} />
      ) : view === 'all' ? (
        <LibraryAll
          books={shown}
          filter={filter}
          onFilter={pickFilter}
          sort={sort}
          onSort={pickSort}
          layout={layout}
          onLayout={pickLayout}
          query={query}
          onClearQuery={clearQuery}
          onImport={importer.start}
          importing={importer.importing}
          onOpen={open}
          onHold={hold}
        />
      ) : (
        <LibraryShelves
          books={live}
          lastRead={lastRead}
          favorites={shelves.favorites}
          onOpen={open}
          onHold={hold}
          onSeeAll={seeAll}
        />
      )}

      {sheetBook ? (
        <BookSheet
          book={sheetBook}
          shelves={shelves}
          update={updateShelves}
          onClose={() => setSheetHash(null)}
          onOpen={open}
          onDetails={(b) => router.push(`/book?hash=${b.hash}`)}
          onSetFinished={setFinished}
          onRemove={removeBook}
        />
      ) : null}
      <Toast />
    </Shell>
  );
}
