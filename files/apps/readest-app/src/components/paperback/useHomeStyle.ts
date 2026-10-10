'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_HOME_STYLE, parseHomeStyle, type HomeStyle } from '@/services/paperback/navStyle';

const KEY = 'paperback.homestyle.v1';

/** The chosen Home layout, kept in local storage. Returns [style, set, ready]. */
export function useHomeStyle(): [HomeStyle, (s: HomeStyle) => void, boolean] {
  const [style, setStyle] = useState<HomeStyle>(DEFAULT_HOME_STYLE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setStyle(parseHomeStyle(localStorage.getItem(KEY)));
    } catch {
      /* keep default */
    }
    setReady(true);
  }, []);

  const set = useCallback((s: HomeStyle) => {
    setStyle(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* not persisted */
    }
  }, []);

  return [style, set, ready];
}
