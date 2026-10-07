'use client';

import { useState } from 'react';
import Shell from '@/components/paperback/Shell';
import { newId, useShelves } from '@/components/paperback/useShelves';
import { addWish, removeWish } from '@/services/paperback/shelves';

export default function WishlistPage() {
  const [shelves, update, ready] = useShelves();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const add = () => {
    if (!title.trim()) return;
    update((s) => addWish(s, title, author, newId(), Date.now()));
    setTitle('');
    setAuthor('');
  };

  return (
    <Shell title='Wishlist'>
      <div className='pb-stack'>
        <div className='pb-card pb-stack'>
          <input
            className='pb-text'
            placeholder='Title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <input
            className='pb-text'
            placeholder='Author (optional)'
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className='pb-btn' onClick={add} disabled={!title.trim()}>
            Add to wishlist
          </button>
        </div>
        <div className='pb-label' style={{ margin: '0 4px' }}>
          {shelves.wishlist.length} {shelves.wishlist.length === 1 ? 'book' : 'books'} · tap ✓ when you own it
        </div>
        {ready && shelves.wishlist.length === 0 && <div className='pb-empty'>Nothing on the wishlist.</div>}
        {shelves.wishlist.map((w) => (
          <div key={w.id} className='pb-row'>
            <div className='pb-grow' style={{ paddingLeft: 6 }}>
              <div className='pb-title'>{w.title}</div>
              {w.author && <div className='pb-label'>{w.author}</div>}
            </div>
            <button
              className='pb-iconbtn'
              aria-label='Got it, remove from wishlist'
              onClick={() => update((s) => removeWish(s, w.id))}
            >
              ✓
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
