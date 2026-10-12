'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_HEADER_SIZE, parseHeaderSize, type HeaderSize } from '@/services/paperback/headerSize';

const KEY = 'paperback.header.v1';

/** The chosen header size, kept in local storage. Returns [size, set]. */
export function useHeaderSize(): [HeaderSize, (s: HeaderSize) => void] {
  const [size, setSize] = useState<HeaderSize>(DEFAULT_HEADER_SIZE);

  useEffect(() => {
    try {
      setSize(parseHeaderSize(localStorage.getItem(KEY)));
    } catch {
      /* keep default */
    }
  }, []);

  const set = useCallback((s: HeaderSize) => {
    setSize(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* not persisted */
    }
  }, []);

  return [size, set];
}
