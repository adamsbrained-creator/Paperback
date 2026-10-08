'use client';

import clsx from 'clsx';
import type { Book } from '@/components/paperback/platform';
import { BookCover }from '@/components/paperback/platform';

export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className='pb-pills' role='tablist'>
      {options.map((o) => (
        <button
          key={o.id}
          role='tab'
          aria-selected={o.id === value}
          className={clsx('pb-pill', o.id === value && 'on')}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='pb-card'>
      <div className='pb-label'>{label}</div>
      <div className='pb-big'>{value}</div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className='pb-track'>
      <div className='pb-fill' style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({
  value,
  children,
  size = 112,
  stroke = 22,
}: {
  value: number;
  children: React.ReactNode;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className='pb-ring' style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='rgba(127,127,127,0.25)' strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke='var(--pb-ac)'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className='pb-ring-mid'>{children}</div>
    </div>
  );
}

const artIndex = (key: string): number => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 6;
};

/** Book thumbnail: the real cover when the book is in the library, else mockup-style art. */
export function Thumb({
  md5,
  book,
  size,
}: {
  md5: string;
  book?: Book;
  size?: 'lg' | 'fill';
}) {
  return (
    <div className={clsx('pb-thumb', size)}>
      <div className={clsx('pb-art', `g${artIndex(md5)}`)}>
        <span className='pb-art-title'>{book?.title}</span>
      </div>
      {book && <BookCover book={book} mode='list' />}
    </div>
  );
}
