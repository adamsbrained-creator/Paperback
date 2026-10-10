'use client';

import { useMemo, useState } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import Sheet from '@/components/paperback/Sheet';
import AppHeader from '@/components/paperback/AppHeader';
import BookRow from '@/components/paperback/BookRow';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useShelves } from '@/components/paperback/useShelves';
import { useHomeStyle } from '@/components/paperback/useHomeStyle';
import PileHome from '@/components/paperback/PileHome';
import { Thumb } from '@/app/stats/components/ui';
import { computeStreaks, formatDuration, secondsByDay } from '@/services/statistics/statsAggregate';
import {
  currentlyReading,
  finishedBooks,
  liveBooks,
  progressFraction,
  progressPercent,
  recentlyRead,
  timeLeftLabel,
  todayTotals,
} from '@/services/paperback/libraryViews';
import { MAX_PINNED, isPinned, togglePin } from '@/services/paperback/shelves';

function ClassicHome() {
  const router = useAppRouter();
  const openBook = usePaperbackOpenBook();
  const { events, now, library, booksByHash, lastRead, pace, loaded } = usePaperbackData();
  const [shelves, updateShelves] = useShelves();
  const [pinOpen, setPinOpen] = useState(false);

  const reading = useMemo(() => currentlyReading(library, lastRead), [library, lastRead]);
  const everything = useMemo(() => liveBooks(library), [library]);
  const today = useMemo(() => todayTotals(events, now), [events, now]);
  const streak = useMemo(() => computeStreaks(secondsByDay(events), now).current, [events, now]);

  const next = reading[0];
  const left = next ? timeLeftLabel(next, pace) : null;
  const pinnedBooks = shelves.pinned
    .map((hash) => booksByHash.get(hash))
    .filter((b): b is NonNullable<typeof b> => !!b);

  return (
    <Shell title='Paperback' tab='home' header={<AppHeader />}>
      <div className='pb-eyebrow'>Continue reading</div>

      {next ? (
        <>
          <div className='pb-continue'>
            <button className='pb-continue-cover' aria-label={`Open ${next.title}`} onClick={() => openBook(next)}>
              <Thumb md5={next.hash} book={booksByHash.get(next.hash)} size='fill' />
            </button>
            <div className='pb-continue-info'>
              <h2 className='pb-ctitle pb-serif'>{next.title}</h2>
              <div className='pb-label'>{next.author}</div>
              <div className='pb-label' style={{ marginTop: 14 }}>
                {next.progress ? `Page ${next.progress[0]} of ${next.progress[1]}` : ' '}
              </div>
              <div className='pb-track page' style={{ margin: '8px 0 10px' }}>
                <div className='pb-fill' style={{ width: `${progressFraction(next) * 100}%` }} />
              </div>
              <div style={{ fontSize: 15 }}>
                {progressPercent(next)}%{left ? ` · ${left}` : ''}
              </div>
            </div>
          </div>
          <button className='pb-resume' onClick={() => openBook(next)}>
            Resume reading
          </button>
        </>
      ) : (
        <div className='pb-card pb-stack' style={{ padding: 22 }}>
          <div className='pb-title pb-serif' style={{ fontSize: 24, fontWeight: 500 }}>
            {loaded ? 'Nothing in progress yet' : 'Loading…'}
          </div>
          <div className='pb-label'>Open a book from your library and it will be waiting here.</div>
          <button className='pb-resume' style={{ marginTop: 6 }} onClick={() => router.push('/books')}>
            Open library
          </button>
        </div>
      )}

      <div className='pb-pinhead'>
        <div className='pb-title'>Pinned for today</div>
        <button className='pb-textbtn' onClick={() => setPinOpen(true)}>
          Edit
        </button>
      </div>
      <div className='pb-pins'>
        {pinnedBooks.map((b) => (
          <button key={b.hash} className='pb-pin' aria-label={`Open ${b.title}`} onClick={() => openBook(b)}>
            <Thumb md5={b.hash} book={b} size='fill' />
          </button>
        ))}
        {pinnedBooks.length < MAX_PINNED && (
          <button className='pb-pin-add' aria-label='Pin a book' onClick={() => setPinOpen(true)}>
            +
          </button>
        )}
      </div>

      <div className='pb-minis'>
        <button className='pb-mini' onClick={() => router.replace('/stats')}>
          <div className='pb-label'>Today</div>
          <div className='pb-mini-val'>{formatDuration(today.seconds)}</div>
        </button>
        <button className='pb-mini' onClick={() => router.replace('/stats')}>
          <div className='pb-label'>Streak</div>
          <div className='pb-mini-val'>
            {streak} {streak === 1 ? 'day' : 'days'}
          </div>
        </button>
      </div>

      <Sheet open={pinOpen} onClose={() => setPinOpen(false)} title='Pinned for today'>
        <div className='pb-note' style={{ margin: '0 0 12px' }}>
          Pin up to {MAX_PINNED} books. They are shown first in Currently reading.
        </div>
        <div className='pb-stack'>
          {everything.length === 0 && <div className='pb-empty'>Your library is empty.</div>}
          {everything.map((b) => {
            const on = isPinned(shelves, b.hash);
            return (
              <BookRow
                key={b.hash}
                book={b}
                onOpen={() => updateShelves((s) => togglePin(s, b.hash))}
                trailing={<span className={on ? 'pb-iconbtn on' : 'pb-iconbtn'}>{on ? '✓' : '+'}</span>}
              />
            );
          })}
        </div>
      </Sheet>
    </Shell>
  );
}

function PileHomeConnected() {
  const openBook = usePaperbackOpenBook();
  const { events, now, library, lastRead } = usePaperbackData();
  const recent = useMemo(() => recentlyRead(library, lastRead, 5), [library, lastRead]);
  const reading = useMemo(() => currentlyReading(library, lastRead), [library, lastRead]);
  const finished = useMemo(() => finishedBooks(library), [library]);
  const finishedRecent = useMemo(
    () => finished.filter((b) => now.getTime() - (b.readingStatusUpdatedAt ?? b.updatedAt) <= 30 * 864e5).length,
    [finished, now],
  );
  const streak = useMemo(() => computeStreaks(secondsByDay(events), now).current, [events, now]);
  return (
    <PileHome
      recent={recent}
      reading={reading}
      finished={finished}
      finishedRecent={finishedRecent}
      streak={streak}
      open={openBook}
    />
  );
}

export default function HomePage() {
  const [homeStyle, , ready] = useHomeStyle();
  // Wait for the saved choice so the wrong layout never flashes.
  if (!ready) return <Shell title='Paperback' tab='home'>{null}</Shell>;
  return homeStyle === 'pile' ? <PileHomeConnected /> : <ClassicHome />;
}
