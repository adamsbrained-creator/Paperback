'use client';

import { useAppRouter } from '@/components/paperback/platform';
import { HomeIcon } from './icons';

/** Title row shown above Readest's catalog toolbar in Discover. */
export default function PaperbackOpdsHeader() {
  const router = useAppRouter();
  return (
    <div className='pb-opdshead'>
      <h1 className='pb-opdstitle'>Discover</h1>
      <button className='pb-opdsround' aria-label='Home' onClick={() => router.replace('/home')}>
        <HomeIcon size={22} />
      </button>
    </div>
  );
}
