'use client';

import { useCallback } from 'react';
import {
  eventDispatcher,
  sourceBook,
  useBookDataStore,
  useEnv,
  useLibraryStore,
} from '@/components/paperback/platform';
import type { PBook } from '@/services/paperback/library';

const toast = (message: string, type: 'info' | 'success' | 'error') =>
  eventDispatcher.dispatch('toast', { message, type, timeout: 2000 });

/** Changes to a book itself (not to your shelves): finished or not, and removing it from the library. */
export function useLibraryActions() {
  const { envConfig, appService } = useEnv();
  const updateBook = useLibraryStore((s) => s.updateBook);
  const clearBookData = useBookDataStore((s) => s.clearBookData);

  const setFinished = useCallback(
    async (book: PBook, finished: boolean): Promise<boolean> => {
      const src = sourceBook(book);
      if (!src) {
        toast('Your library is still loading. Try again in a moment.', 'info');
        return false;
      }
      try {
        const now = Date.now();
        src.readingStatus = finished ? 'finished' : 'unread';
        src.readingStatusUpdatedAt = now;
        src.updatedAt = now;
        await updateBook(envConfig, src);
        toast(finished ? 'Marked as finished.' : 'Marked as not finished.', 'success');
        return true;
      } catch (e) {
        console.error('[paperback] could not change the status:', e);
        toast('Could not change the book.', 'error');
        return false;
      }
    },
    [envConfig, updateBook],
  );

  /** Deletes the book's file from the app and takes it off your shelves (reading history is kept). */
  const removeBook = useCallback(
    async (book: PBook): Promise<boolean> => {
      const src = sourceBook(book);
      if (!src || !appService) {
        toast('Your library is still loading. Try again in a moment.', 'info');
        return false;
      }
      try {
        await appService.deleteBook(src, 'local');
        src.deletedAt = Date.now();
        src.downloadedAt = null;
        src.coverDownloadedAt = null;
        await updateBook(envConfig, src);
        clearBookData(src.hash);
        toast(`Removed ${book.title}.`, 'info');
        return true;
      } catch (e) {
        console.error('[paperback] could not remove the book:', e);
        toast('Could not remove the book.', 'error');
        return false;
      }
    },
    [appService, envConfig, updateBook, clearBookData],
  );

  return { setFinished, removeBook };
}
