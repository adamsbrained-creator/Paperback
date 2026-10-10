'use client';

import type { PBook } from '@/services/paperback/library';
import { Thumb } from '@/app/stats/components/ui';

/** A tappable book row (cover, title, subtitle) with an optional trailing control. */
export default function BookRow({
  book,
  sub,
  onOpen,
  trailing,
}: {
  book: PBook;
  sub?: string;
  onOpen: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className='pb-row'>
      <button className='pb-rowmain' onClick={onOpen}>
        <Thumb md5={book.hash} book={book} />
        <div className='pb-grow'>
          <div className='pb-title pb-ellipsis'>{book.title}</div>
          <div className='pb-label pb-ellipsis'>{sub ?? book.author}</div>
        </div>
      </button>
      {trailing}
    </div>
  );
}
