'use client';

import { useThemeStore } from '@/components/paperback/platform';
import { MenuLinesIcon } from './icons';

/** The round floating menu button (bottom right) that opens the page list. */
export default function MenuFab({ onOpen }: { onOpen: () => void }) {
  const { safeAreaInsets } = useThemeStore();
  return (
    <button className='pb-set-fab' style={{ bottom: 24 + (safeAreaInsets?.bottom || 0) }} aria-label='Open menu' onClick={onOpen}>
      <MenuLinesIcon size={24} strokeWidth={2} />
    </button>
  );
}
