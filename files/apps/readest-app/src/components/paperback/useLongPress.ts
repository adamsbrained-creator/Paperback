'use client';

import { useCallback, useRef } from 'react';

/**
 * Tap vs. press-and-hold on one element: `onTap` on a normal tap, `onHold` after `ms`.
 * Spread the result onto a <button>.
 */
export function useLongPress(onTap: () => void, onHold: () => void, ms = 450) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onPointerDown: () => {
      held.current = false;
      clear();
      timer.current = setTimeout(() => {
        held.current = true;
        onHold();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onClick: () => {
      if (held.current) {
        held.current = false;
        return;
      }
      onTap();
    },
  };
}
