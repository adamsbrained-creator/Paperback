'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_NAV_STYLE, parseNavStyle, type NavStyle } from '@/services/paperback/navStyle';

const KEY = 'paperback.nav.v1';

/** The chosen navigation style, kept in local storage. Returns [style, set]. */
export function useNavStyle(): [NavStyle, (s: NavStyle) => void] {
  const [style, setStyle] = useState<NavStyle>(DEFAULT_NAV_STYLE);

  useEffect(() => {
    try {
      setStyle(parseNavStyle(localStorage.getItem(KEY)));
    } catch {
      /* keep default */
    }
  }, []);

  const set = useCallback((s: NavStyle) => {
    setStyle(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* not persisted */
    }
  }, []);

  return [style, set];
}
