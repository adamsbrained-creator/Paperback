'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  AboutIcon,
  CheckCircleIcon,
  FolderPlusIcon,
  HeartIcon,
  PinIcon,
  ReaderIcon,
  TrashIcon,
} from './icons';
import LibCover from './LibCover';
import { newId } from './useShelves';
import { progressPercent, statusOf } from '@/services/paperback/libraryViews';
import type { PBook } from '@/services/paperback/library';
import { sheetProgressLine } from '@/services/paperback/libraryShelves';
import {
  createCollection,
  inCollection,
  isFavorite,
  isPinned,
  toggleFavorite,
  toggleInCollection,
  togglePin,
  type Shelves,
} from '@/services/paperback/shelves';

type Step = 'actions' | 'collections' | 'remove';

/**
 * What you can do with a book (opens on press-and-hold): resume, pin, favorite, add to a collection,
 * mark finished, see details, or remove it from the library.
 */
export default function BookSheet({
  book,
  shelves,
  update,
  onClose,
  onOpen,
  onDetails,
  onSetFinished,
  onRemove,
}: {
  book: PBook;
  shelves: Shelves;
  update: (fn: (s: Shelves) => Shelves) => void;
  onClose: () => void;
  onOpen: (book: PBook) => void;
  onDetails: (book: PBook) => void;
  onSetFinished: (book: PBook, finished: boolean) => Promise<boolean>;
  onRemove: (book: PBook) => Promise<boolean>;
}) {
  const [step, setStep] = useState<Step>('actions');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const st = statusOf(book);
  const finished = st === 'finished';
  const fav = isFavorite(shelves, book.hash);
  const pinned = isPinned(shelves, book.hash);
  const primary = finished ? 'Read again' : st === 'reading' ? 'Resume reading' : 'Start reading';

  const run = async (job: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await job();
    setBusy(false);
    if (ok) onClose();
  };

  const actions: { icon: React.ComponentType<{ size?: number }>; label: string; go: () => void }[] = [
    { icon: PinIcon, label: pinned ? 'Unpin from today' : 'Pin for today', go: () => (update((s) => togglePin(s, book.hash)), onClose()) },
    { icon: HeartIcon, label: fav ? 'Remove from Favorites' : 'Add to Favorites', go: () => (update((s) => toggleFavorite(s, book.hash)), onClose()) },
    { icon: FolderPlusIcon, label: 'Add to collection', go: () => setStep('collections') },
    { icon: CheckCircleIcon, label: finished ? 'Mark as not finished' : 'Mark as finished', go: () => void run(() => onSetFinished(book, !finished)) },
    { icon: AboutIcon, label: 'Book details', go: () => (onClose(), onDetails(book)) },
  ];

  return (
    <div className='pbl-scrim' onClick={onClose}>
      <div className='pbl-sheet' role='dialog' aria-label={book.title} onClick={(e) => e.stopPropagation()}>
        <div className='pbl-grab' />

        <div className='pbl-sheet-head'>
          <div className='pbl-sheet-cover'>
            <LibCover book={book} width={48} />
          </div>
          <div className='pbl-sheet-info'>
            <div className='pbl-sheet-title'>{book.title}</div>
            {book.author ? <div className='pbl-sheet-author'>{book.author}</div> : null}
            <div className='pbl-sheet-prog'>
              <div className='pbl-sheet-track'>
                <div style={{ width: `${progressPercent(book)}%` }} />
              </div>
              <span>{sheetProgressLine(book)}</span>
            </div>
          </div>
        </div>

        {step === 'actions' && (
          <>
            <button className='pbl-bigbtn dark' onClick={() => (onClose(), onOpen(book))}>
              <ReaderIcon size={20} />
              {primary}
            </button>
            <div className='pbl-actions'>
              {actions.map((a) => (
                <button key={a.label} className='pbl-action' disabled={busy} onClick={a.go}>
                  <a.icon size={22} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
            <div className='pbl-actions pbl-danger'>
              <button className='pbl-action' onClick={() => setStep('remove')}>
                <TrashIcon size={22} />
                <span>Remove from library</span>
              </button>
            </div>
          </>
        )}

        {step === 'collections' && (
          <>
            <div className='pbl-step-title'>Add to collection</div>
            <div className='pbl-actions'>
              {shelves.collections.length === 0 ? <div className='pbl-step-note'>No collections yet. Make the first one below.</div> : null}
              {shelves.collections.map((c) => {
                const on = inCollection(shelves, c.id, book.hash);
                return (
                  <button key={c.id} className={clsx('pbl-action', on && 'on')} onClick={() => update((s) => toggleInCollection(s, c.id, book.hash))}>
                    <FolderPlusIcon size={22} />
                    <span>{c.name}</span>
                    {on ? <span className='pbl-tick'>✓</span> : null}
                  </button>
                );
              })}
            </div>
            <div className='pbl-newcol'>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder='New collection' spellCheck={false} />
              <button
                disabled={!name.trim()}
                onClick={() => {
                  const id = newId();
                  const label = name.trim();
                  update((s) => toggleInCollection(createCollection(s, label, id), id, book.hash));
                  setName('');
                }}
              >
                Create
              </button>
            </div>
            <button className='pbl-bigbtn' onClick={() => setStep('actions')}>
              Done
            </button>
          </>
        )}

        {step === 'remove' && (
          <>
            <div className='pbl-step-title'>Remove “{book.title}”?</div>
            <div className='pbl-step-note'>
              This deletes the book file from Paperback. Your reading history stays, and you can import the book again later.
            </div>
            <button className='pbl-bigbtn danger' disabled={busy} onClick={() => void run(() => onRemove(book))}>
              Remove from library
            </button>
            <button className='pbl-bigbtn' onClick={() => setStep('actions')}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
