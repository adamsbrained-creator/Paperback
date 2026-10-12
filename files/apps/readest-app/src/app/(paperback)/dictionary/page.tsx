'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from '@/components/paperback/icons';
import { useEnv } from '@/components/paperback/platform';
import { useCustomDictionaryStore } from '@/components/paperback/platform';
import {
  DictionaryResultsBody,
  DictionaryResultsHeader,
  useDictionaryResults,
} from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useShelves } from '@/components/paperback/useShelves';
import { definitionSnippet } from '@/services/paperback/backup';
import { isWordSaved, removeWord, saveWord } from '@/services/paperback/shelves';

/** Readest's own lookup (Wiktionary, Wikipedia and any dictionaries you imported), in a page. */
function Results({
  word,
  saved,
  onSave,
}: {
  word: string;
  saved: boolean;
  onSave: (word: string, note: string) => void;
}) {
  const state = useDictionaryResults({ word });
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className='pb-stack'>
      <div className='pb-card pb-dict'>
        <DictionaryResultsHeader
          currentWord={state.currentWord}
          canGoBack={state.canGoBack}
          goBack={state.goBack}
          onSpeak={state.speakWord}
          speaking={state.isSpeaking}
        />
        <div ref={bodyRef} className='pb-dict-body'>
          <DictionaryResultsBody {...state} />
        </div>
      </div>
      <button
        className='pb-btn'
        disabled={saved}
        onClick={() =>
          onSave(
            state.currentWord || word,
            definitionSnippet(bodyRef.current?.innerText ?? '', state.currentWord || word),
          )
        }
      >
        {saved ? 'Saved' : 'Save word'}
      </button>
    </div>
  );
}

export default function DictionaryPage() {
  const { envConfig } = useEnv();
  const loadCustomDictionaries = useCustomDictionaryStore((s) => s.loadCustomDictionaries);
  const [shelves, update] = useShelves();
  const [draft, setDraft] = useState('');
  const [word, setWord] = useState('');

  // Pulls in dictionaries you imported in Readest's settings.
  useEffect(() => {
    void loadCustomDictionaries(envConfig).catch(() => {});
  }, [envConfig, loadCustomDictionaries]);

  const search = (w: string) => {
    const t = w.trim();
    if (t) setWord(t);
  };

  return (
    <Shell title='Dictionary'>
      <div className='pb-stack'>
        <div className='pb-search'>
          <SearchIcon size={20} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(draft)}
            placeholder='Look up a word'
            autoCapitalize='none'
            spellCheck={false}
          />
          {draft && (
            <button className='pb-clear' onClick={() => search(draft)}>
              Look up
            </button>
          )}
        </div>

        {word && (
          <Results
            key={word}
            word={word}
            saved={isWordSaved(shelves, word)}
            onSave={(w, note) => update((s) => saveWord(s, w, note, Date.now()))}
          />
        )}

        <div className='pb-sec'>Saved words</div>
        {shelves.savedWords.length === 0 && <div className='pb-empty'>No saved words yet.</div>}
        {shelves.savedWords.map((w) => (
          <div key={w.word} className='pb-row'>
            <button
              className='pb-rowmain'
              onClick={() => {
                setDraft(w.word);
                setWord(w.word);
              }}
            >
              <div className='pb-grow' style={{ paddingLeft: 6 }}>
                <div className='pb-title'>{w.word}</div>
                {w.note && <div className='pb-label pb-clamp2'>{w.note}</div>}
              </div>
            </button>
            <button
              className='pb-iconbtn'
              aria-label={`Remove ${w.word}`}
              onClick={() => update((s) => removeWord(s, w.word))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
