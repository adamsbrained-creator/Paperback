'use client';

import { useCallback } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useMakeBookAvailable } from '@/hooks/useMakeBookAvailable';
import { useBookTransferActions } from '@/app/library/hooks/useBookTransferActions';
import { useLibraryStore } from '@/store/libraryStore';
import { navigateToReader } from '@/utils/nav';
import { isAudiobook } from '@/utils/audiobook';
import type { Book } from '@/types/book';

// There is no progress UI on these screens, so the download plumbing gets no-op sinks
// (same approach as Readest's deep-link handler).
const noop = () => {};

/**
 * Opens a book (optionally at a CFI location) from a Paperback screen. Cloud-only books are downloaded first,
 * exactly like tapping them in the Library.
 */
export function usePaperbackOpenBook() {
  const router = useAppRouter();
  const { envConfig, appService } = useEnv();
  const updateBook = useLibraryStore((s) => s.updateBook);
  const { handleBookDownload } = useBookTransferActions(envConfig, appService, updateBook, noop);
  const makeBookAvailable = useMakeBookAvailable({ setLoading: noop, handleBookDownload });

  return useCallback(
    async (book: Book, cfi?: string) => {
      if (isAudiobook(book)) {
        router.push(`/player?id=${book.hash}`);
        return;
      }
      if (!(await makeBookAvailable(book))) return;
      const params = new URLSearchParams();
      if (cfi) params.set('cfi', cfi);
      navigateToReader(router, [book.hash], params.size ? params.toString() : undefined);
    },
    [router, makeBookAvailable],
  );
}
