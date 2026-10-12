'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { CheckSmallIcon, ChevronDownIcon, CloseIcon, GridViewIcon, ListViewIcon, PlusIcon } from './icons';
import LibCover from './LibCover';
import { useLongPress } from './useLongPress';
import { progressPercent, statusOf } from '@/services/paperback/libraryViews';
import type { PBook } from '@/services/paperback/library';
import {
  GRID_FILTERS,
  SORTS,
  type GridFilter,
  type SortId,
} from '@/services/paperback/libraryShelves';

export type LibraryLayout = 'grid' | 'list';

interface Actions {
  onOpen: (book: PBook) => void;
  onHold: (book: PBook) => void;
}

function StatusLine({ book }: { book: PBook }) {
  const st = statusOf(book);
  if (st === 'reading') {
    const pct = progressPercent(book);
    return (
      <div className='pbl-status'>
        <div className='pbl-track'>
          <div style={{ width: `${pct}%` }} />
        </div>
        <span>{pct}%</span>
      </div>
    );
  }
  if (st === 'finished') {
    return (
      <div className='pbl-status'>
        <CheckSmallIcon size={16} strokeWidth={2.2} />
        <span>Finished</span>
      </div>
    );
  }
  return (
    <div className='pbl-status'>
      <span className='pbl-new'>New</span>
    </div>
  );
}

function GridItem({ book, onOpen, onHold }: Actions & { book: PBook }) {
  const press = useLongPress(
    () => onOpen(book),
    () => onHold(book),
  );
  return (
    <button className='pbl-item' aria-label={`Open ${book.title}`} {...press}>
      <LibCover book={book} width={108} />
      <span className='pbl-item-title'>{book.title}</span>
      <span className='pbl-item-author'>{book.author}</span>
      <StatusLine book={book} />
    </button>
  );
}

function ListItem({ book, onOpen, onHold }: Actions & { book: PBook }) {
  const press = useLongPress(
    () => onOpen(book),
    () => onHold(book),
  );
  return (
    <button className='pbl-listitem' aria-label={`Open ${book.title}`} {...press}>
      <LibCover book={book} width={48} />
      <span className='pbl-listitem-body'>
        <span className='pbl-item-title one'>{book.title}</span>
        <span className='pbl-item-author'>{book.author}</span>
        <StatusLine book={book} />
      </span>
    </button>
  );
}

/** All books: filter chips, sort, grid/list toggle, add button, then the books. */
export default function LibraryAll({
  books,
  filter,
  onFilter,
  sort,
  onSort,
  layout,
  onLayout,
  query,
  onClearQuery,
  onImport,
  importing,
  onOpen,
  onHold,
}: Actions & {
  books: PBook[];
  filter: GridFilter;
  onFilter: (f: GridFilter) => void;
  sort: SortId;
  onSort: (s: SortId) => void;
  layout: LibraryLayout;
  onLayout: (l: LibraryLayout) => void;
  query: string;
  onClearQuery: () => void;
  onImport: () => void;
  importing: boolean;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? 'Recently opened';
  return (
    <div className='pbl-all'>
      <div className='pbl-chips-wrap'>
        <div className='pbl-chips'>
          {GRID_FILTERS.map((c) => (
            <button
              key={c.id}
              className={clsx('pbl-chip', filter === c.id && 'on')}
              aria-pressed={filter === c.id}
              onClick={() => onFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className='pbl-chips-fade' />
      </div>

      <div className='pbl-tools'>
        <div className='pbl-sortwrap'>
          <button className='pbl-sort' aria-haspopup='listbox' aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)}>
            {sortLabel}
            <ChevronDownIcon size={16} strokeWidth={2} />
          </button>
          {sortOpen && (
            <>
              <div className='pbl-popscrim' onClick={() => setSortOpen(false)} />
              <div className='pbl-sortmenu' role='listbox'>
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    role='option'
                    aria-selected={s.id === sort}
                    className={clsx(s.id === sort && 'on')}
                    onClick={() => {
                      onSort(s.id);
                      setSortOpen(false);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className='pbl-grow' />
        <div className='pbl-toggle'>
          <button className={clsx(layout === 'grid' && 'on')} aria-label='Grid view' aria-pressed={layout === 'grid'} onClick={() => onLayout('grid')}>
            <GridViewIcon size={18} />
          </button>
          <button className={clsx(layout === 'list' && 'on')} aria-label='List view' aria-pressed={layout === 'list'} onClick={() => onLayout('list')}>
            <ListViewIcon size={18} />
          </button>
        </div>
        <button className='pbl-add' aria-label='Add book' disabled={importing} onClick={onImport}>
          <PlusIcon size={20} strokeWidth={2} />
        </button>
      </div>

      {query ? (
        <button className='pbl-query' onClick={onClearQuery} aria-label='Clear search'>
          <span>“{query}”</span>
          <CloseIcon size={14} strokeWidth={2} />
        </button>
      ) : null}

      {books.length === 0 ? (
        <div className='pbl-none'>{query ? 'No books match.' : 'No books here yet.'}</div>
      ) : layout === 'grid' ? (
        <div className='pbl-grid'>
          {books.map((b) => (
            <GridItem key={b.hash} book={b} onOpen={onOpen} onHold={onHold} />
          ))}
        </div>
      ) : (
        <div className='pbl-list'>
          {books.map((b) => (
            <ListItem key={b.hash} book={b} onOpen={onOpen} onHold={onHold} />
          ))}
        </div>
      )}
    </div>
  );
}
