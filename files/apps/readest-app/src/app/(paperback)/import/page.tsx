'use client';

import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useImportBooks } from '@/components/paperback/useImportBooks';
import { Toast } from '@/components/paperback/platform';

const FORMATS = ['EPUB', 'PDF', 'MOBI', 'AZW3', 'FB2', 'CBZ', 'TXT'];

/** Add books from the phone, or go and fetch some from Discover. */
export default function ImportPage() {
  const router = useAppRouter();
  const { start, importing } = useImportBooks();
  return (
    <Shell title='Import' pageHeader>
      <div className='pb-stack'>
        <div className='pb-card pb-stack' style={{ textAlign: 'center', padding: 24 }}>
          <div className='pb-title' style={{ fontSize: 20 }}>
            Add books
          </div>
          <div className='pb-label'>{FORMATS.join(' · ')}</div>
          <button className='pb-btn' disabled={importing} onClick={start}>
            {importing ? 'Importing…' : 'Choose books from your phone'}
          </button>
        </div>
        <div className='pb-note'>You can pick several files at once. To fetch books from the internet instead, open Discover.</div>
        <button className='pb-btn ghost' onClick={() => router.push('/discover')}>
          Discover free books
        </button>
        <button className='pb-btn ghost' onClick={() => router.push('/books')}>
          Back to the Library
        </button>
      </div>
      <Toast />
    </Shell>
  );
}
