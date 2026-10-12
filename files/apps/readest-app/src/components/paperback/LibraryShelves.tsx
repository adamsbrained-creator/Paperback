'use client';

import { HeartIcon } from './icons';
import LibCover from './LibCover';
import { useLongPress } from './useLongPress';
import { progressPercent } from '@/services/paperback/libraryViews';
import type { PBook } from '@/services/paperback/library';
import {
  buildShelves,
  filterForShelf,
  resumeLine,
  shelfMeta,
  type GridFilter,
  type ShelfId,
} from '@/services/paperback/libraryShelves';

interface Actions {
  onOpen: (book: PBook) => void;
  onHold: (book: PBook) => void;
}

function ShelfTile({ book, meta, onOpen, onHold }: Actions & { book: PBook; meta: string }) {
  const press = useLongPress(
    () => onOpen(book),
    () => onHold(book),
  );
  return (
    <button className='pbl-tile' aria-label={`Open ${book.title}`} {...press}>
      <LibCover book={book} width={96} />
      <span className='pbl-tile-title'>{book.title}</span>
      <span className='pbl-tile-meta'>{meta}</span>
    </button>
  );
}

function ResumeCard({ book, onOpen, onHold }: Actions & { book: PBook }) {
  const press = useLongPress(
    () => onOpen(book),
    () => onHold(book),
  );
  return (
    <div className='pbl-resume'>
      <button className='pbl-resume-cover' aria-label={`Open ${book.title}`} {...press}>
        <LibCover book={book} width={84} />
      </button>
      <div className='pbl-resume-body'>
        <div className='pbl-resume-kicker'>CONTINUE READING</div>
        <div className='pbl-resume-title'>{book.title}</div>
        {book.author ? <div className='pbl-resume-author'>{book.author}</div> : null}
        <div className='pbl-grow' />
        <div className='pbl-resume-track'>
          <div style={{ width: `${progressPercent(book)}%` }} />
        </div>
        <div className='pbl-resume-foot'>
          <span>{resumeLine(book)}</span>
          <button className='pbl-resume-btn' onClick={() => onOpen(book)}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

/** The Library's home layout: the book to continue, then shelves (Also reading, Not started, Favorites, Finished). */
export default function LibraryShelves({
  books,
  lastRead,
  favorites,
  onOpen,
  onHold,
  onSeeAll,
}: Actions & {
  books: PBook[];
  lastRead: Map<string, number>;
  favorites: string[];
  onSeeAll: (filter: GridFilter) => void;
}) {
  const { resume, shelves } = buildShelves(books, lastRead, favorites);
  const count = (id: ShelfId, n: number) => (id === 'reading' && resume ? n + 1 : n);
  return (
    <div className='pbl-shelves'>
      {resume ? <ResumeCard book={resume} onOpen={onOpen} onHold={onHold} /> : null}

      {shelves.map((s) => (
        <section key={s.id} className='pbl-shelf'>
          <div className='pbl-shelf-head'>
            <div className='pbl-shelf-name'>
              {s.label}
              <span>{count(s.id, s.books.length)}</span>
            </div>
            <button className='pbl-seeall' onClick={() => onSeeAll(filterForShelf(s.id))}>
              See all
            </button>
          </div>
          <div className='pbl-shelf-wrap'>
            <div className='pbl-shelf-row'>
              {s.books.map((b) => (
                <ShelfTile key={b.hash} book={b} meta={shelfMeta(s.id, b)} onOpen={onOpen} onHold={onHold} />
              ))}
              {s.books.length === 0 ? (
                <>
                  <div className='pbl-dash'>
                    <HeartIcon size={26} />
                  </div>
                  <div className='pbl-dash-note'>Nothing here yet. Long-press a book and choose Add to Favorites.</div>
                </>
              ) : null}
            </div>
            <div className='pbl-fade' />
          </div>
        </section>
      ))}
    </div>
  );
}
