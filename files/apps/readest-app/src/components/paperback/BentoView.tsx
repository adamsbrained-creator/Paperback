'use client';

import { useMemo } from 'react';
import { Thumb } from '@/app/stats/components/ui';
import type { PBook } from '@/services/paperback/library';
import { progressPercent } from '@/services/paperback/libraryViews';
import { filterNotes, newestFirst, type NoteRow } from '@/services/paperback/notesViews';

interface Props {
  books: PBook[]; // most recently read first
  notes: NoteRow[] | null;
  open: (b: PBook) => void;
  onStack: () => void; // tapping the stack shows the whole list
  onNotes: () => void;
}

/** The "bento" Library view: a collage of tiles from what you read most recently. */
export default function BentoView({ books, notes, open, onStack, onNotes }: Props) {
  const [first, second] = books;
  const quotes = useMemo(() => newestFirst(filterNotes(notes ?? [], 'all')).filter((n) => n.text || n.note), [notes]);
  const q1 = quotes[0];
  const q2 = quotes[1];
  const counts = useMemo(() => {
    if (!q1) return null;
    const mine = (notes ?? []).filter((n) => n.bookHash === q1.bookHash);
    return { notes: mine.filter((n) => n.kind === 'note').length, highlights: mine.filter((n) => n.kind === 'highlight').length };
  }, [notes, q1]);

  if (books.length === 0) return <div className='pb-empty'>Nothing to show yet.</div>;

  const cover = (b: PBook) => (
    <button key={b.hash} className='pb-bentocover' aria-label={`Open ${b.title}`} onClick={() => open(b)}>
      <Thumb md5={b.hash} book={b} size='fill' />
    </button>
  );

  return (
    <div className='pb-bento'>
      <div className='pb-bentocol'>
        <button className='pb-bentostack' aria-label='Show all books' onClick={onStack}>
          {books.slice(0, 3).map((b) => (
            <div key={b.hash} className='pb-bs'>
              <Thumb md5={b.hash} book={b} size='fill' />
            </div>
          ))}
        </button>
        {q1 && (
          <button className='pb-bentonote' onClick={onNotes}>
            <div className='pb-label'>
              {q1.bookTitle}
              {q1.page ? ` · p. ${q1.page}` : ''}
            </div>
            <div className='pb-serif pb-bq'>{q1.note || q1.text}</div>
            {counts && (
              <div className='pb-label'>
                {counts.notes} {counts.notes === 1 ? 'note' : 'notes'} · {counts.highlights}{' '}
                {counts.highlights === 1 ? 'highlight' : 'highlights'}
              </div>
            )}
          </button>
        )}
        {second && cover(second)}
      </div>
      <div className='pb-bentocol'>
        {first && cover(first)}
        {first && (
          <button className='pb-bentopct' onClick={() => open(first)}>
            <div className='pb-serif pb-bpct'>{progressPercent(first)}%</div>
            <div className='pb-ellipsis'>{first.title}</div>
          </button>
        )}
        {q2 && (
          <button className='pb-bentonote' onClick={onNotes}>
            <div className='pb-serif pb-bq'>{q2.note || q2.text}</div>
            <div className='pb-label'>
              {q2.bookTitle} · {q2.kind === 'note' ? 'note' : 'highlight'}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
