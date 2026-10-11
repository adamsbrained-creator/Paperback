'use client';

import { PiHouse } from 'react-icons/pi';
import { useAppRouter } from '@/components/paperback/platform';

/** Title row shown above Readest's catalog toolbar in Discover. */
export default function PaperbackOpdsHeader() {
  const router = useAppRouter();
  return (
    <div className='pb-opdshead'>
      <h1 className='pb-opdstitle'>Discover</h1>
      <button className='pb-opdsround' aria-label='Home' onClick={() => router.replace('/home')}>
        <PiHouse size={22} />
      </button>
    </div>
  );
}
