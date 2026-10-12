'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { shareToApps, useAppRouter, useThemeStore } from '@/components/paperback/platform';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { usePaperbackOpenBook } from '@/components/paperback/useOpenBook';
import { useBooknotes } from '@/components/paperback/useBooknotes';
import SendToScrapbook from '@/components/paperback/SendToScrapbook';
import { useShelves } from '@/components/paperback/useShelves';
import { Ring, Thumb } from '@/app/stats/components/ui';
import { progressFraction, progressPercent, timeLeftLabel } from '@/services/paperback/libraryViews';
import { newestFirst, filterNotes } from '@/services/paperback/notesViews';
import { scrapbookHighlight, scrapbookText } from '@/services/paperback/scrapbook';
import { setJournal } from '@/services/paperback/shelves';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * One book's page: your own note, your latest highlights, where you are, and a way back in.
 * (The "journal" mockup: Back / Save, date, serif title, collage of cards.)
 */
export default function JournalPage() {
  const router = useAppRouter();
  const { isDarkMode, safeAreaInsets } = useThemeStore();
  const openBook = usePaperbackOpenBook();
  const { booksByHash, pace, now, libraryLoaded } = usePaperbackData();
  const [shelves, update, ready] = useShelves();
  const [hash, setHash] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => setHash(new URLSearchParams(window.location.search).get('hash')), []);

  const book = hash ? booksByHash.get(hash) : undefined;
  const books = useMemo(() => (book ? [book] : []), [book]);
  const rows = useBooknotes(books, !!book);
  const cards = useMemo(
    () => newestFirst(filterNotes(rows ?? [], 'all')).slice(0, 4),
    [rows],
  );

  const stored = hash ? (shelves.journal[hash] ?? '') : '';
  const text = draft ?? stored;
  const dirty = draft !== null && draft !== stored;
  const left = book ? timeLeftLabel(book, pace) : null;
  const date = `${WEEKDAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const save = () => {
    if (!hash || draft === null) return;
    update((s) => setJournal(s, hash, draft));
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // Opens the share sheet; pick Scrapbook there and it opens its "Save to Scrapbook" screen with this note.
  const sendToScrapbook = async () => {
    if (!book) return;
    const out = scrapbookText(book, text);
    if (!out) return;
    const result = await shareToApps(out);
    setSent(
      result === 'copied'
        ? 'Copied. Paste it into Scrapbook.'
        : result === 'failed'
          ? 'Could not open the share sheet.'
          : null,
    );
  };

  return (
    <div
      className={clsx('pb-root', isDarkMode && 'pb-dark')}
      style={{ paddingTop: safeAreaInsets?.top || 0, paddingBottom: safeAreaInsets?.bottom || 0 }}
    >
      <span className='bookshelf' hidden aria-hidden />
      <div className='pb-statusscrim' style={{ height: safeAreaInsets?.top || 0 }} />
      <div className='pb-wrap'>
        <div className='pb-jhead'>
          <button className='pb-pill big' onClick={() => router.back()}>
            Back
          </button>
          <button className='pb-pill big' disabled={!dirty} onClick={save}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {!book ? (
          <div className='pb-empty'>{libraryLoaded && hash ? 'This book is not in your library.' : 'Loading…'}</div>
        ) : (
          <>
            <div className='pb-eyebrow' style={{ textAlign: 'center', margin: '4px 0 0' }}>
              {date}
            </div>
            <h1 className='pb-jtitle pb-serif'>{book.title}</h1>
            <div className='pb-squiggle' />
            <div className='pb-eyebrow' style={{ textAlign: 'center', margin: '8px 0 18px' }}>
              {book.progress ? `Page ${book.progress[0]} of ${book.progress[1]}` : book.author}
            </div>

            <div className='pb-jcollage'>
              <button className='pb-jcover' aria-label={`Open ${book.title}`} onClick={() => openBook(book)}>
                <Thumb md5={book.hash} book={book} size='fill' />
              </button>
              {cards[0] && (
                <div className='pb-qwrap' style={{ flex: 1, minWidth: 0, marginTop: 14 }}>
                  <button
                    className='pb-jquote'
                    onClick={() => openBook(book, cards[0]!.cfi)}
                    style={{ width: '100%', marginTop: 0, paddingRight: 52, transform: 'rotate(1.4deg)' }}
                  >
                    <div className='pb-serif pb-jq'>{cards[0].note || cards[0].text}</div>
                    <div className='pb-label' style={{ marginTop: 8 }}>
                      {cards[0].page ? `p. ${cards[0].page} · ` : ''}
                      {cards[0].kind === 'note' ? 'note' : 'highlight'}
                    </div>
                  </button>
                  <SendToScrapbook text={scrapbookHighlight(cards[0], book.author)} top={8} />
                </div>
              )}
            </div>

            <div className='pb-jprogress'>
              <Ring value={progressFraction(book)} size={108} stroke={14}>
                <div className='pb-title'>{progressPercent(book)}%</div>
              </Ring>
              {left && <span className='pb-jpill'>{left}</span>}
            </div>

            <button className='pb-jnext pb-serif' onClick={() => openBook(book)}>
              keep reading →
            </button>

            <div className='pb-sec'>My note</div>
            <textarea
              className='pb-journal pb-serif'
              placeholder='Write about this book…'
              value={text}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
            />
            <button className='pb-btn ghost' disabled={!text.trim()} onClick={sendToScrapbook}>
              Send to Scrapbook
            </button>
            {sent && <div className='pb-note'>{sent}</div>}

            {cards.length > 1 && <div className='pb-sec'>More from this book</div>}
            <div className='pb-stack'>
              {cards.slice(1).map((c, i) => (
                <div key={c.key} className='pb-qwrap'>
                  <button
                    className={c.kind === 'highlight' ? 'pb-qcard' : 'pb-qcard plain'}
                    style={{
                      paddingRight: 56,
                      transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)`,
                      ...(c.kind === 'highlight' ? { background: c.color } : {}),
                    }}
                    onClick={() => openBook(book, c.cfi)}
                  >
                    <div className='pb-quote small'>{c.note || c.text}</div>
                    <div className='pb-label' style={{ marginTop: 6, color: 'inherit', opacity: 0.65 }}>
                      {c.page ? `p. ${c.page}` : ''}
                    </div>
                  </button>
                  <SendToScrapbook text={scrapbookHighlight(c, book.author)} />
                </div>
              ))}
              {cards.length > 0 && (
                <button className='pb-btn ghost' onClick={() => router.push(`/notes?book=${book.hash}`)}>
                  All notes and highlights
                </button>
              )}
              {ready && cards.length === 0 && rows !== null && (
                <div className='pb-note'>No highlights yet. Select text while reading to add one.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
