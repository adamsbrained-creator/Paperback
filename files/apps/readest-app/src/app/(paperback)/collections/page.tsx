'use client';

import { useMemo, useState } from 'react';
import { useAppRouter } from '@/hooks/useAppRouter';
import Shell from '@/components/paperback/Shell';
import { usePaperbackData } from '@/components/paperback/usePaperbackData';
import { newId, useShelves } from '@/components/paperback/useShelves';
import { Thumb } from '@/app/stats/components/ui';
import { createCollection, listCollections } from '@/services/paperback/shelves';

export default function CollectionsPage() {
  const router = useAppRouter();
  const { library, booksByHash, now } = usePaperbackData();
  const [shelves, update] = useShelves();
  const [name, setName] = useState('');
  const all = useMemo(() => listCollections(library, shelves, now), [library, shelves, now]);

  const create = () => {
    if (!name.trim()) return;
    const id = newId();
    update((s) => createCollection(s, name, id));
    setName('');
    router.push(`/collection?id=${encodeURIComponent(id)}`);
  };

  return (
    <Shell title='Collections'>
      <div className='pb-stack'>
        <div className='pb-card pb-stack'>
          <input
            className='pb-text'
            placeholder='New collection name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button className='pb-btn' onClick={create} disabled={!name.trim()}>
            Create collection
          </button>
        </div>
        {all.map((c) => (
          <button
            key={c.id}
            className='pb-row pb-rowbtn'
            onClick={() => router.push(`/collection?id=${encodeURIComponent(c.id)}`)}
          >
            <div className='pb-grow'>
              <div className='pb-title pb-ellipsis'>{c.name}</div>
              <div className='pb-label'>
                {c.note} · {c.books.length} {c.books.length === 1 ? 'book' : 'books'}
              </div>
            </div>
            <div className='pb-strip'>
              {c.books.slice(0, 3).map((b) => (
                <Thumb key={b.hash} md5={b.hash} book={booksByHash.get(b.hash)} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
