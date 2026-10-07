'use client';

import { useMemo } from 'react';
import { PiCaretRight } from 'react-icons/pi';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useSettingsStore } from '@/store/settingsStore';
import Shell from '@/components/paperback/Shell';

interface Catalog {
  id: string;
  name: string;
  url: string;
  note: string;
}

// Free public-domain libraries that speak OPDS.
const PRESETS: Catalog[] = [
  { id: 'paperback-gutenberg', name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks.opds/', note: 'Over 70,000 free classics' },
  { id: 'paperback-standard', name: 'Standard Ebooks', url: 'https://standardebooks.org/feeds/opds', note: 'Carefully formatted public-domain books' },
];

/** Online catalogs, opened in Readest's OPDS browser (search, browse, download into your library). */
export default function DiscoverPage() {
  const router = useAppRouter();
  const saved = useSettingsStore((s) => s.settings?.opdsCatalogs);

  const catalogs = useMemo<Catalog[]>(() => {
    const mine = (saved ?? [])
      .filter((c) => !c.disabled)
      .map((c) => ({ id: c.id, name: c.name, url: c.url, note: c.description ?? 'Your catalog' }));
    const urls = new Set(mine.map((c) => c.url));
    return [...mine, ...PRESETS.filter((p) => !urls.has(p.url))];
  }, [saved]);

  return (
    <Shell title='Discover'>
      <div className='pb-stack'>
        {catalogs.map((c) => (
          <button
            key={c.id}
            className='pb-row pb-rowbtn'
            onClick={() =>
              router.push(`/opds?url=${encodeURIComponent(c.url)}&id=${encodeURIComponent(c.id)}`)
            }
          >
            <div className='pb-grow' style={{ paddingLeft: 6 }}>
              <div className='pb-title'>{c.name}</div>
              <div className='pb-label pb-ellipsis'>{c.note}</div>
            </div>
            <PiCaretRight size={18} />
          </button>
        ))}
        <div className='pb-note'>
          Books you download land in your library. Your own catalogs (Calibre, Kavita, a library server)
          can be added from the Library menu and will show up here.
        </div>
      </div>
    </Shell>
  );
}
