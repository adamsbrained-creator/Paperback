'use client';

import { useLayoutEffect } from 'react';
import { useAppRouter } from '@/components/paperback/platform';
import { usePaperbackBoot } from './useBoot';

/** A blank launch screen: starts the app, then moves on to `to`. */
export default function Boot({ to }: { to: string }) {
  const router = useAppRouter();
  const { ready } = usePaperbackBoot();
  useLayoutEffect(() => {
    if (ready) router.replace(to);
  }, [ready, router, to]);
  return <div className='bg-base-100 h-screen' />;
}
