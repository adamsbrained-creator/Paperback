'use client';

import { useState } from 'react';
import { ShareIcon } from './icons';
import { shareToApps } from './platform';

/**
 * A small round button in the top right of a card (the card sits in a `position: relative` wrapper).
 * It opens the phone's share sheet with `text`; pick Scrapbook there. If there is no share sheet the text
 * is copied and a short message says so.
 */
export default function SendToScrapbook({ text, top = 10 }: { text: string; top?: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (!text) return null;
  const send = async () => {
    const result = await shareToApps(text);
    if (result === 'shared') return setMsg(null);
    setMsg(result === 'copied' ? 'Copied. Paste it into Scrapbook.' : 'Could not share.');
    setTimeout(() => setMsg(null), 2600);
  };
  return (
    <>
      <button className='pb-sendsb' style={{ top }} aria-label='Send to Scrapbook' onClick={send}>
        <ShareIcon size={18} />
      </button>
      {msg && (
        <div className='pb-sendsb-msg' style={{ top: top + 42 }}>
          {msg}
        </div>
      )}
    </>
  );
}
