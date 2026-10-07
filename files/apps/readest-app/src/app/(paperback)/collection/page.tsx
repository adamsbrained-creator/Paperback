'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppRouter } from '@/hooks/useAppRouter';
import Shell from '@/components/paperback/Shell';
import BookRow from '@/components/paperback/BookRow';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { useShelves } from '@/components/paperback/useShelves';
import {
  deleteCollection,
  inCollection,
  renameCollection,
  resolveCollection,
  toggleInCollection,
} from '@/services/paperback/shelves';
import { liveBooks } from '@/services/paperback/libraryViews';

/** One collection / tag / automatic shelf. The id comes from ?id= (see resolveCollection). */
export default function CollectionPage() {
  const router = useAppRouter();
  const { library, now, libraryLoaded } = usePaperbackData();
  const [shelves, update, ready] = useShelves();
  const [id, setId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => setId(new URLSearchParams(window.location.search).get('id')), []);

  const col = useMemo(
    () => (id ? resolveCollection(id, library, shelves, now) : null),
    [id, library, shelves, now],
  );
  const everything = useMemo(() => liveBooks(library), [library]);

  if (!col) {
    return (
      <Shell title='Collection'>
        <div className='pb-empty'>{ready && libraryLoaded && id ? 'This collection no longer exists.' : 'Loading…'}</div>
      </Shell>
    );
  }
  const manual = col.kind === 'manual';

  return (
    <Shell title={col.name}>
      <div className='pb-stack'>
        <div className='pb-label' style={{ margin: '0 4px' }}>
          {col.note} · {col.books.length} {col.books.length === 1 ? 'book' : 'books'}
        </div>

        {manual && (
          <div className='pb-pills'>
            <button className={editing ? 'pb-pill on' : 'pb-pill'} onClick={() => setEditing(!editing)}>
              {editing ? 'Done' : 'Add / remove books'}
            </button>
            <button
              className='pb-pill'
              onClick={() => {
                const next = window.prompt('Rename collection', col.name);
                if (next) update((s) => renameCollection(s, col.id, next));
              }}
            >
              Rename
            </button>
            <button
              className='pb-pill'
              onClick={() => {
                if (window.confirm(`Delete “${col.name}”? Your books are not deleted.`)) {
                  update((s) => deleteCollection(s, col.id));
                  router.replace('/collections');
                }
              }}
            >
              Delete
            </button>
          </div>
        )}

        {manual && editing
          ? everything.map((b) => {
              const on = inCollection(shelves, col.id, b.hash);
              return (
                <BookRow
                  key={b.hash}
                  book={b}
                  onOpen={() => update((s) => toggleInCollection(s, col.id, b.hash))}
                  trailing={<span className={on ? 'pb-iconbtn on' : 'pb-iconbtn'}>{on ? '✓' : '+'}</span>}
                />
              );
            })
          : col.books.map((b) => (
              <BookRow key={b.hash} book={b} onOpen={() => router.push(`/book?hash=${b.hash}`)} />
            ))}

        {ready && !editing && col.books.length === 0 && (
          <div className="pb-empty">
            {manual ? 'Empty. Tap “Add / remove books”.' : 'No books here right now.'}
          </div>
        )}
      </div>
    </Shell>
  );
}
