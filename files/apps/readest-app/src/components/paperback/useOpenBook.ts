'use client';

import { useCallback } from 'react';
import { useEnv } from '@/components/paperback/platform';
import { useAppRouter } from '@/components/paperback/platform';
import { useMakeBookAvailable } from '@/components/paperback/platform';
import { useBookTransferActions } from '@/components/paperback/platform';
import { useLibraryStore } from '@/components/paperback/platform';
import { navigateToReader } from '@/components/paperback/platform';
import { eventDispatcher, isAudiobook, sourceBook } from '@/components/paperback/platform';
import type { PBook } from '@/services/paperback/library';

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
    async (book: PBook, cfi?: string) => {
      const src = sourceBook(book);
      if (!src) {
        // Paperback's saved list shows before Readest's library has finished loading.
        eventDispatcher.dispatch('toast', { message: 'Your library is still loading. Try again in a moment.', type: 'info' });
        return;
      }
      if (isAudiobook(src)) {
        router.push(`/player?id=${src.hash}`);
        return;
      }
      if (!(await makeBookAvailable(src))) return;
      const params = new URLSearchParams();
      if (cfi) params.set('cfi', cfi);
      navigateToReader(router, [book.hash], params.size ? params.toString() : undefined);
    },
    [router, makeBookAvailable],
  );
}
