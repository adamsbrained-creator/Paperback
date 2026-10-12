'use client';

import { useEffect, useRef, useState } from 'react';
import {
  eventDispatcher,
  ingestFile,
  navigateToReader,
  parseOpenWithFiles,
  splitLibraryOpenIds,
  useAppRouter,
  useAppUrlIngress,
  useEnv,
  useLibraryStore,
  useOpenLaunchLinks,
  useOpenWithBooks,
  useSettingsStore,
  type Book,
} from '@/components/paperback/platform';

/**
 * Starting the app (the work Readest's library page used to do on launch):
 *  - loads your settings and library from the device,
 *  - opens a book handed over by the phone ("Open with", a link) or the last books you were reading,
 *  - lets those hand-overs through while the app is open.
 * `ready` is true once nothing else has claimed the launch and the library is loaded.
 */
export function usePaperbackBoot(): { ready: boolean } {
  const router = useAppRouter();
  const { envConfig } = useEnv();
  const libraryLoaded = useLibraryStore((s) => s.libraryLoaded);
  const launchBusy = useLibraryStore(
    (s) => s.checkOpenWithBooks || s.checkLastOpenBooks || s.checkPendingLaunchLink,
  );
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  // Incoming files and links while the app is open.
  useAppUrlIngress();
  useOpenWithBooks();
  useOpenLaunchLinks();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const releaseGates = () => {
      const store = useLibraryStore.getState();
      store.setCheckOpenWithBooks(false);
      store.setCheckLastOpenBooks(false);
      store.setCheckPendingLaunchLink(false);
    };

    const openBooks = (ids: string[], library: Book[]) => {
      const { audiobookHash, readerIds, droppedAudiobooks } = splitLibraryOpenIds(ids, (hash) =>
        library.find((b) => b.hash === hash),
      );
      if (audiobookHash) {
        router.push(`/player?id=${audiobookHash}`);
        return;
      }
      if (droppedAudiobooks) {
        eventDispatcher.dispatch('toast', { message: 'Audiobooks open in the player', type: 'info' });
      }
      if (readerIds.length > 0) navigateToReader(router, readerIds);
    };

    (async () => {
      const appService = await envConfig.getAppService();
      const settings = await appService.loadSettings();
      useSettingsStore.getState().setSettings(settings);

      const store = useLibraryStore.getState();
      const cached = store.libraryLoaded;
      const library = cached ? store.library : await appService.loadLibraryBooks();

      let toOpen: string[] = [];

      // A file the phone asked us to open ("Open with Paperback", a shared file).
      if (store.checkOpenWithBooks) {
        const files = (await parseOpenWithFiles(appService)) || [];
        for (const file of files) {
          try {
            const book = await ingestFile(
              { file, books: library, transient: appService.isMobile ? false : !settings.autoImportBooksOnOpen },
              { appService, settings, isLoggedIn: false },
            );
            if (book) toOpen.push(book.hash);
          } catch (e) {
            console.warn('[paperback] could not open', file, e);
          }
        }
        if (files.length > 0) appService.saveLibraryBooks(library);
      }

      // The books that were open when the app was last closed (if that setting is on).
      if (toOpen.length === 0 && store.checkLastOpenBooks && settings.openLastBooks) {
        for (const hash of settings.lastOpenBooks ?? []) {
          const book = library.find((b) => b.hash === hash && b.readingStatus !== 'finished');
          if (book && (await appService.isBookAvailable(book))) toOpen.push(book.hash);
        }
      }

      if (!cached || library !== store.library) store.setLibrary(library);
      if (toOpen.length > 0) {
        openBooks(toOpen, library);
        toOpen = [];
      }
      // A launch link that has nothing to do releases its own gate; the other two are ours.
      store.setCheckOpenWithBooks(false);
      store.setCheckLastOpenBooks(false);
    })().catch((e) => {
      console.error('[paperback] could not start:', e);
      releaseGates();
      eventDispatcher.dispatch('toast', { message: 'Could not load your library.', type: 'error', timeout: 8000 });
      setFailed(true);
    });
  }, [envConfig, router]);

  return { ready: failed || (libraryLoaded && !launchBusy) };
}
