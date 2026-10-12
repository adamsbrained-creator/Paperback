// The ONE place where Paperback's screens take things from Readest.
//
// Every screen, hook and component in Paperback imports Readest code through this file, so what
// Paperback still needs from Readest is exactly the list below. To stop depending on Readest, give
// each name here a Paperback implementation; no screen has to change.
//
// Left to replace (by area):
//   library & reading data ... useLibrary, useLibraryStore, StatisticsDb, useBookTransferActions,
//                              useMakeBookAvailable, Book, sourceBook, ingestFile, buildBookLookupIndex,
//                              runWithConcurrency, useBookDataStore
//   file picking & launch ..... useFileSelector, showFilePicker, useAndroidPickedBooks, parseOpenWithFiles,
//                              useAppUrlIngress, useOpenWithBooks, useOpenLaunchLinks, splitLibraryOpenIds
//   app shell ................. useEnv, useAppRouter, eventDispatcher, navigateToReader, useTheme,
//                              useThemeStore, useSettingsStore, useTranslation, Toast, SettingsDialog
//   covers & audio ............ BookCover, isAudiobook
//   dictionary ................ useDictionaryResults, DictionaryResultsHeader, DictionaryResultsBody,
//                              useCustomDictionaryStore
//   sharing ................... shareToApps (the phone's share sheet, through Readest's sharekit plugin)
// (Already replaced by Paperback: the Library screen, its import and remove actions, and the launch screen.)

export { useBookTransferActions } from '@/app/library/hooks/useBookTransferActions';
export {
  DictionaryResultsBody,
  DictionaryResultsHeader,
  useDictionaryResults,
} from '@/app/reader/components/annotator/DictionaryResultsView';
export { default as BookCover } from '@/components/BookCover';
export { useEnv } from '@/context/EnvContext';
export { useAppRouter } from '@/hooks/useAppRouter';
export { useLibrary } from '@/hooks/useLibrary';
export { useMakeBookAvailable } from '@/hooks/useMakeBookAvailable';
export { useTheme } from '@/hooks/useTheme';
export { StatisticsDb } from '@/services/statistics/statisticsDb';
export { useCustomDictionaryStore } from '@/store/customDictionaryStore';
export { useLibraryStore } from '@/store/libraryStore';
export { useSettingsStore } from '@/store/settingsStore';
export { useThemeStore } from '@/store/themeStore';
import type { Book } from '@/types/book';
export type { Book };
export { isAudiobook } from '@/utils/audiobook';
export { eventDispatcher } from '@/utils/event';
export { navigateToReader } from '@/utils/nav';

export { BackupWindow, setBackupDialogVisible } from '@/app/library/components/BackupWindow';
export { default as SettingsDialog } from '@/components/settings/SettingsDialog';
export { Toast } from '@/components/Toast';
export { useAndroidPickedBooks } from '@/hooks/useAndroidFilePicker';
export { useAppUrlIngress } from '@/hooks/useAppUrlIngress';
export { useFileSelector } from '@/hooks/useFileSelector';
export type { SelectedFile } from '@/hooks/useFileSelector';
export { useOpenLaunchLinks } from '@/hooks/useOpenLaunchLinks';
export { useOpenWithBooks } from '@/hooks/useOpenWithBooks';
export { useTranslation } from '@/hooks/useTranslation';
export { parseOpenWithFiles } from '@/helpers/openWith';
export { buildBookLookupIndex } from '@/services/bookService';
export { ingestFile } from '@/services/ingestService';
export { useBookDataStore } from '@/store/bookDataStore';
export { splitLibraryOpenIds } from '@/utils/audiobook';
export { showFilePicker } from '@/utils/bridge';
export { runWithConcurrency } from '@/utils/concurrency';

/** The Readest book behind a Paperback book; undefined until Readest's library has loaded. */
export const sourceBook = (b: { source?: unknown }): Book | undefined => b.source as Book | undefined;

/**
 * Opens the phone's share sheet with some text (Scrapbook is one of the apps listed there).
 * Android hands the text over as plain text, so the first line becomes the title in Scrapbook.
 * Returns 'shared' once the sheet was opened, 'copied' when there is no share sheet and the text
 * went to the clipboard instead, or 'failed'.
 */
export async function shareToApps(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    const { shareText } = await import('@choochmeque/tauri-plugin-sharekit-api');
    await shareText(text);
    return 'shared';
  } catch (err) {
    console.warn('[paperback] share sheet failed:', err);
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
