'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useShelves } from '@/components/paperback/useShelves';
import { Progress, Thumb } from '@/app/stats/components/ui';
import { inCollection, isFavorite, setRating, toggleFavorite, toggleInCollection } from '@/services/paperback/shelves';
import { computeSummary, formatDuration } from '@/services/statistics/statsAggregate';
import {
  lastReadAt,
  progressFraction,
  progressPercent,
  relativeTime,
  timeLeftLabel,
} from '@/services/paperback/libraryViews';

export default function BookDetailsPage() {
  const router = useAppRouter();
  const openBook = usePaperbackOpenBook();
  const { events, booksByHash, lastRead, pace, now, libraryLoaded } = usePaperbackData();
  const [shelves, updateShelves] = useShelves();
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => setHash(new URLSearchParams(window.location.search).get('hash')), []);

  const book = hash ? booksByHash.get(hash) : undefined;
  const mine = useMemo(() => events.filter((e) => e.md5 === hash), [events, hash]);
  const spent = useMemo(() => computeSummary(mine), [mine]);

  if (!book) {
    return (
      <Shell title='Book Details'>
        <div className='pb-empty'>{libraryLoaded && hash ? 'This book is not in your library.' : 'Loading…'}</div>
      </Shell>
    );
  }

  const language = book.language;
  const pages = book.progress?.[1];
  const left = timeLeftLabel(book, pace);
  const started = progressFraction(book) > 0;

  return (
    <Shell title='Book Details'>
      <div className='pb-stack'>
        <div style={{ width: 168, margin: '4px auto 8px' }}>
          <Thumb md5={book.hash} book={book} size='fill' />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className='pb-h1' style={{ fontSize: 28 }}>
            {book.title}
          </div>
          <div className='pb-label'>{book.author}</div>
        </div>

        <div className='pb-grid3'>
          <div className='pb-card'>
            <div className='pb-label'>Pages</div>
            <div className='pb-big' style={{ fontSize: 24 }}>
              {pages ?? '–'}
            </div>
          </div>
          <div className='pb-card'>
            <div className='pb-label'>Format</div>
            <div className='pb-big' style={{ fontSize: 24 }}>
              {book.format}
            </div>
          </div>
          <div className='pb-card'>
            <div className='pb-label'>Language</div>
            <div className='pb-big' style={{ fontSize: 24 }}>
              {language ? language.slice(0, 2).toUpperCase() : '–'}
            </div>
          </div>
        </div>

        <div className='pb-card'>
          <div className='pb-goal-row'>
            <div className='pb-title'>
              {started ? `${progressPercent(book)}%` : 'Not started'}
            </div>
            <div className='pb-label'>{left ?? ''}</div>
          </div>
          <Progress value={progressFraction(book)} />
          {started && (
            <div className='pb-note' style={{ margin: '10px 0 0' }}>
              Last read {relativeTime(lastReadAt(book, lastRead), now).replace('Opened ', '')}
            </div>
          )}
        </div>

        <div className='pb-grid2'>
          <div className='pb-card'>
            <div className='pb-label'>Time spent</div>
            <div className='pb-big' style={{ fontSize: 24 }}>
              {spent.seconds ? formatDuration(spent.seconds) : '–'}
            </div>
          </div>
          <div className='pb-card'>
            <div className='pb-label'>Sessions</div>
            <div className='pb-big' style={{ fontSize: 24 }}>
              {spent.sessions || '–'}
            </div>
          </div>
        </div>

        <div className='pb-card pb-stack'>
          <div className='pb-goal-row' style={{ marginBottom: 0 }}>
            <div className='pb-stars' role='group' aria-label='Rating'>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={n <= (shelves.ratings[book.hash] ?? 0) ? 'pb-star on' : 'pb-star'}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => updateShelves((s) => setRating(s, book.hash, n))}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              className={isFavorite(shelves, book.hash) ? 'pb-iconbtn on' : 'pb-iconbtn'}
              aria-label='Favorite'
              aria-pressed={isFavorite(shelves, book.hash)}
              onClick={() => updateShelves((s) => toggleFavorite(s, book.hash))}
            >
              {isFavorite(shelves, book.hash) ? '♥' : '♡'}
            </button>
          </div>
          <div className='pb-pills'>
            {shelves.collections.map((c) => (
              <button
                key={c.id}
                className={inCollection(shelves, c.id, book.hash) ? 'pb-pill on' : 'pb-pill'}
                onClick={() => updateShelves((s) => toggleInCollection(s, c.id, book.hash))}
              >
                {c.name}
              </button>
            ))}
            <button className='pb-pill' onClick={() => router.push('/collections')}>
              {shelves.collections.length ? 'Manage' : '+ New collection'}
            </button>
          </div>
        </div>

        <div className='pb-grid2'>
          <button className='pb-btn' onClick={() => openBook(book)}>
            {started ? 'Continue' : 'Start reading'}
          </button>
          <button className='pb-btn ghost' onClick={() => router.push(`/journal?hash=${book.hash}`)}>
            Journal
          </button>
        </div>
      </div>
    </Shell>
  );
}
