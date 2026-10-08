'use client';

import { useAppRouter } from '@/components/paperback/platform';
import { navigateToLibrary } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';

const FORMATS = ['EPUB', 'PDF', 'MOBI', 'AZW3', 'FB2', 'CBZ', 'TXT'];

/** Importing is done by Readest's Library (file picker, folders, groups); this is the way in. */
export default function ImportPage() {
  const router = useAppRouter();
  return (
    <Shell title='Import'>
      <div className='pb-stack'>
        <div className='pb-card pb-stack' style={{ textAlign: 'center', padding: 24 }}>
          <div className='pb-title' style={{ fontSize: 20 }}>
            Add books
          </div>
          <div className='pb-label'>{FORMATS.join(' · ')}</div>
          <button className='pb-btn' onClick={() => navigateToLibrary(router)}>
            Open the library manager to import
          </button>
        </div>
        <div className='pb-note'>
          In the library manager, use the + at the top to pick files or a whole folder. To fetch books from the
          internet instead, open Discover.
        </div>
        <button className='pb-btn ghost' onClick={() => router.push('/discover')}>
          Discover free books
        </button>
      </div>
    </Shell>
  );
}
