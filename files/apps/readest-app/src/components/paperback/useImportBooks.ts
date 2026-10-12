'use client';

import { useCallback, useState } from 'react';
import {
  buildBookLookupIndex,
  eventDispatcher,
  ingestFile,
  runWithConcurrency,
  showFilePicker,
  useAndroidPickedBooks,
  useEnv,
  useFileSelector,
  useLibraryStore,
  useSettingsStore,
  useTranslation,
  type SelectedFile,
} from '@/components/paperback/platform';

const CONCURRENCY = 3;

const toast = (message: string, type: 'info' | 'success' | 'error', timeout = 2500) =>
  eventDispatcher.dispatch('toast', { message, type, timeout });

/**
 * Importing books from the phone: opens the system file picker (several files at once), adds each
 * book to the library and saves it. `importing` is true while it runs.
 */
export function useImportBooks() {
  const { envConfig, appService } = useEnv();
  const _ = useTranslation();
  const { selectFiles } = useFileSelector(appService, _);
  const [importing, setImporting] = useState(false);

  const importFiles = useCallback(
    async (files: SelectedFile[]) => {
      if (!appService || files.length === 0) return;
      setImporting(true);
      const store = useLibraryStore.getState();
      const { library } = store;
      const { settings } = useSettingsStore.getState();
      const index = buildBookLookupIndex(library, appService.osPlatform);
      const failed: string[] = [];
      let added = 0;
      try {
        await runWithConcurrency(files, CONCURRENCY, async (selected) => {
          const file = selected.file || selected.path;
          if (!file) return;
          try {
            const book = await ingestFile(
              { file, books: library, lookupIndex: index },
              { appService, settings, isLoggedIn: false, appBooksPrefix: settings.localBooksDir || null },
            );
            if (book) {
              await store.updateBooks(envConfig, [book], { skipSave: true });
              added++;
            }
          } catch (e) {
            console.error('[paperback] could not import', file, e);
            failed.push(selected.name || (typeof file === 'string' ? file.split('/').pop() || file : file.name));
          }
        });
        if (added > 0) await appService.saveLibraryBooks(useLibraryStore.getState().library);
      } finally {
        setImporting(false);
      }
      if (failed.length > 0) {
        toast(
          failed.length === 1
            ? `Could not import ${failed[0]}.`
            : `Could not import ${failed.length} files (${failed.slice(0, 2).join(', ')}…).`,
          'error',
          5000,
        );
      }
      if (added > 0) toast(added === 1 ? 'Added 1 book.' : `Added ${added} books.`, 'success');
    },
    [appService, envConfig],
  );

  // Android hands the picked files back through an event, even after the app was restarted.
  useAndroidPickedBooks(appService, (files) => {
    void importFiles(files);
  });

  const start = useCallback(() => {
    if (!appService || importing) return;
    if (appService.isAndroidApp) {
      showFilePicker().catch((e: unknown) => console.error('[paperback] file picker failed:', e));
      return;
    }
    selectFiles({ type: 'books', multiple: true }).then((result) => {
      if (result.files.length === 0 || result.error) return;
      void importFiles(result.files);
    });
  }, [appService, importing, selectFiles, importFiles]);

  return { start, importing };
}
