'use client';

import { useRef, useState } from 'react';
import { useEnv } from '@/components/paperback/platform';
import { useAppRouter } from '@/components/paperback/platform';
import { navigateToLibrary } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useShelves } from '@/components/paperback/useShelves';
import { loadGoals, normalizeGoals, saveGoals } from '@/app/stats/goals';
import {
  backupFilename,
  buildBackup,
  describeShelves,
  parseBackup,
  type ParsedBackup,
} from '@/services/paperback/backup';

/** Backup of Paperback's own data. Books, notes and settings have Readest's backup in Library. */
export default function BackupPage() {
  const router = useAppRouter();
  const { appService } = useEnv();
  const [shelves, update] = useShelves();
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const [pending, setPending] = useState<Extract<ParsedBackup, { ok: true }> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const now = new Date();
    const json = JSON.stringify(buildBackup(shelves, { ...loadGoals() }, now), null, 2);
    try {
      const ok = await appService?.saveFile(backupFilename(now), json, { mimeType: 'application/json' });
      setMessage(ok ? { text: 'Backup saved.' } : { text: 'Saving was cancelled.', bad: true });
    } catch (e) {
      console.warn('[paperback] backup failed:', e);
      setMessage({ text: 'Could not save the backup file.', bad: true });
    }
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setPending(null);
      setMessage({ text: parsed.error, bad: true });
    } else {
      setPending(parsed);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const doRestore = () => {
    if (!pending) return;
    update(() => pending.shelves);
    if (pending.goals) saveGoals(normalizeGoals(pending.goals));
    setPending(null);
    setMessage({ text: 'Backup restored.' });
  };

  return (
    <Shell title='Backup'>
      <div className='pb-stack'>
        <div className='pb-card'>
          <div className='pb-title'>Your Paperback data</div>
          <div className='pb-label' style={{ marginTop: 6 }}>
            {describeShelves(shelves)}, plus your reading goals.
          </div>
        </div>

        <button className='pb-btn' onClick={doExport}>
          Save a backup file
        </button>
        <button className='pb-btn ghost' onClick={() => fileInput.current?.click()}>
          Restore from a backup file
        </button>
        <input
          ref={fileInput}
          type='file'
          accept='application/json,.json'
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        {pending && (
          <div className='pb-card pb-stack'>
            <div className='pb-title'>Restore this backup?</div>
            <div className='pb-label'>
              {pending.exportedAt ? `Made ${new Date(pending.exportedAt).toLocaleString()}. ` : ''}
              {describeShelves(pending.shelves)}. It replaces your current favorites, ratings, wishlist,
              collections, saved words and goals.
            </div>
            <button className='pb-btn' onClick={doRestore}>
              Replace my data
            </button>
            <button className='pb-btn ghost' onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}

        {message && <div className={message.bad ? 'pb-note pb-pk' : 'pb-note'}>{message.text}</div>}

        <div className='pb-note'>
          This file holds only what Paperback adds. Your books, notes, highlights, reading history and
          app settings have their own backup in the Library menu.
        </div>
        <button className='pb-btn ghost' onClick={() => navigateToLibrary(router)}>
          Open library manager
        </button>
      </div>
    </Shell>
  );
}
