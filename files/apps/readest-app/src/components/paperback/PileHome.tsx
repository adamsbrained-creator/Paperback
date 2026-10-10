'use client';

import { useMemo, useState } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from './Shell';
import MenuSheet from './MenuSheet';
import { useBooknotes } from './useBooknotes';
import { Thumb } from '@/app/stats/components/ui';
import type { PBook } from '@/services/paperback/library';
import { filterNotes, newestFirst } from '@/services/paperback/notesViews';

interface Props {
  recent: PBook[]; // most recently read first
  reading: PBook[];
  finished: PBook[]; // newest first
  finishedRecent: number; // finished in the last 30 days
  streak: number;
  open: (b: PBook) => void;
}

const SLOTS = ['s0', 's1', 's2', 's3', 's4'];

/** The "pile" Home layout: a heap of your covers with your latest note, then shelves. */
export default function PileHome({ recent, reading, finished, finishedRecent, streak, open }: Props) {
  const router = useAppRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const pile = useMemo(() => recent.slice(0, 5), [recent]);
  const rows = useBooknotes(pile, pile.length > 0);
  const note = useMemo(() => newestFirst(filterNotes(rows ?? [], 'all')).find((n) => n.text || n.note), [rows]);

  const header = (
    <div className='pb-pilehead'>
      <button className='pb-orb' aria-label='Menu' onClick={() => setMenuOpen(true)} />
      <div className='pb-pilemark pb-serif'>paperback</div>
      <button className='pb-streakbadge' aria-label={`${streak} day streak`} onClick={() => router.replace('/stats')}>
        {streak}
      </button>
    </div>
  );

  return (
    <Shell title='Paperback' tab='home' header={header}>
      <div className='pb-pile'>
        {pile.map((b, i) => (
          <button key={b.hash} className={`pb-pile-item ${SLOTS[i]}`} aria-label={`Open ${b.title}`} onClick={() => open(b)}>
            <Thumb md5={b.hash} book={b} size='fill' />
          </button>
        ))}
        {note && (
          <button className='pb-pile-note' onClick={() => router.push('/notes')}>
            <span className='pb-notechip'>Notes</span>
            <div className='pb-serif pb-pile-quote'>{note.note || note.text}</div>
          </button>
        )}
        {pile.length === 0 && <div className='pb-empty'>Open a book from your library and your pile will start to grow.</div>}
      </div>

      <div className='pb-pilegrid'>
        <div>
          <button className='pb-pilebox' aria-label='Reading' onClick={() => router.push('/reading')}>
            {reading.slice(0, 4).map((b, i) => (
              <div key={b.hash} className={`pb-minicard m${i}`}>
                <Thumb md5={b.hash} book={b} size='fill' />
              </div>
            ))}
          </button>
          <div className='pb-serif pb-pilecap'>Reading</div>
          <div className='pb-label' style={{ textAlign: 'center' }}>
            {reading.length} {reading.length === 1 ? 'book' : 'books'}
          </div>
        </div>
        <div>
          <button className='pb-pilebox' aria-label='Finished' onClick={() => router.push('/finished')}>
            {finished[0] && (
              <div className='pb-finishedcover'>
                <Thumb md5={finished[0].hash} book={finished[0]} size='fill' />
              </div>
            )}
            <span className='pb-darkchip'>{finished.length}</span>
          </button>
          <div className='pb-serif pb-pilecap'>Finished</div>
          <div className='pb-label' style={{ textAlign: 'center' }}>
            {finishedRecent > 0 ? `+ ${finishedRecent} new` : `${finished.length} ${finished.length === 1 ? 'book' : 'books'}`}
          </div>
        </div>
      </div>

      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </Shell>
  );
}
