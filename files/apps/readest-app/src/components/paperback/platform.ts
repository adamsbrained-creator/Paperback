// The ONE place where Paperback's screens take things from Readest.
//
// Every screen, hook and component in Paperback imports Readest code through this file, so what
// Paperback still needs from Readest is exactly the list below. To stop depending on Readest, give
// each name here a Paperback implementation; no screen has to change.
//
// Left to replace (by area):
//   library & reading data ... useLibrary, useLibraryStore, StatisticsDb, useBookTransferActions,
//                              useMakeBookAvailable, Book, sourceBook
//   app shell ................. useEnv, useAppRouter, eventDispatcher, navigateToLibrary, navigateToReader, useTheme,
//                              useThemeStore, useSettingsStore
//   covers & audio ............ BookCover, isAudiobook
//   dictionary ................ useDictionaryResults, DictionaryResultsHeader, DictionaryResultsBody,
//                              useCustomDictionaryStore

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
export { navigateToLibrary, navigateToReader } from '@/utils/nav';

/** The Readest book behind a Paperback book; undefined until Readest's library has loaded. */
export const sourceBook = (b: { source?: unknown }): Book | undefined => b.source as Book | undefined;
