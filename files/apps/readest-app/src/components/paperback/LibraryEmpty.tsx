'use client';

import { DiscoverIcon, ImportFileIcon } from './icons';

/** Shown when the library has no books. */
export default function LibraryEmpty({
  onImport,
  onDiscover,
  importing,
}: {
  onImport: () => void;
  onDiscover: () => void;
  importing: boolean;
}) {
  return (
    <div className='pbl-empty'>
      <svg width='176' height='132' viewBox='0 0 176 132' aria-hidden='true'>
        <rect x='22' y='14' width='124' height='28' rx='8' fill='#F2674A' />
        <rect x='30' y='14' width='4' height='28' fill='#FFFFFF' opacity='0.4' />
        <rect x='36' y='48' width='126' height='30' rx='8' fill='var(--pbl-track)' />
        <rect x='44' y='48' width='4' height='30' fill='#FFFFFF' opacity='0.6' />
        <rect x='14' y='84' width='118' height='26' rx='8' fill='var(--pb-ink)' />
        <rect x='22' y='84' width='4' height='26' fill='#FFFFFF' opacity='0.3' />
        <rect x='4' y='116' width='168' height='6' rx='3' fill='var(--pbl-dash)' />
      </svg>
      <div className='pbl-empty-title'>Your library is empty</div>
      <div className='pbl-empty-copy'>Add EPUB files from your phone, or pick something free to start reading today.</div>
      <div className='pbl-empty-actions'>
        <button className='pbl-bigbtn dark' disabled={importing} onClick={onImport}>
          <ImportFileIcon size={20} strokeWidth={2} />
          {importing ? 'Importing…' : 'Import books'}
        </button>
        <button className='pbl-bigbtn' onClick={onDiscover}>
          <DiscoverIcon size={20} />
          Discover free books
        </button>
      </div>
      <div className='pbl-empty-note'>Already run Calibre or Kavita? Connect your catalog from the menu.</div>
    </div>
  );
}
