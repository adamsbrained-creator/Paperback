'use client';

import { BookCover, sourceBook } from '@/components/paperback/platform';
import { coverColors, coverInitial, showsFullCover } from '@/services/paperback/bookCovers';
import type { PBook } from '@/services/paperback/library';

/**
 * A book cover from the Cover design: the book's own cover image when it has one, otherwise a drawn
 * cover in a colour taken from the book (title and author when wide, just the initial when small).
 * `width` says how wide the cover is shown; sizes inside scale with it.
 */
export default function LibCover({ book, width }: { book: PBook; width: number }) {
  const { bg, fg } = coverColors(book.hash);
  const full = showsFullCover(width);
  const src = sourceBook(book);
  return (
    <div className='pbl-cover' style={{ width, background: bg, color: fg, borderRadius: Math.max(5, Math.round(width * 0.06)) }}>
      <span className='pbl-ring' style={{ borderColor: fg }} />
      {full ? (
        <span className='pbl-cover-text'>
          <span className='pbl-rule' style={{ background: fg }} />
          <span className='pbl-cover-title'>{book.title}</span>
          {book.author ? <span className='pbl-cover-author'>{book.author}</span> : null}
        </span>
      ) : (
        <span className='pbl-initial'>{coverInitial(book.title)}</span>
      )}
      {src && <BookCover book={src} mode='list' />}
    </div>
  );
}
