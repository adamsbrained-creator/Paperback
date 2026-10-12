'use client';

import clsx from 'clsx';
import { useState } from 'react';
import MenuFab from '@/components/paperback/MenuFab';
import MenuSheet from '@/components/paperback/MenuSheet';
import PageHeader from '@/components/paperback/PageHeader';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useHeaderSize } from '@/components/paperback/useHeaderSize';
import { HEADER_SIZES, type HeaderSize } from '@/services/paperback/headerSize';

const SAMPLES: { id: HeaderSize; note?: string; isDefault?: boolean }[] = [
  { id: 'compact', note: 'no circles, left-aligned' },
  { id: 'regular', isDefault: true },
  { id: 'large' },
];

export default function AppStylePage() {
  const router = useAppRouter();
  const [size, setSize] = useHeaderSize();
  const [menuOpen, setMenuOpen] = useState(false);

  const header = (
    <PageHeader
      label='App style'
      size={size}
      onMenu={() => setMenuOpen(true)}
      onSearch={() => router.push('/search')}
    />
  );

  return (
    <Shell title='App style' header={header} wrapClassName='pb-set-wrap'>
      <div className='pb-as-intro'>Choose how much room the top bar takes on every screen.</div>

      <div className='pb-as-card'>
        <div className='pb-as-cardtitle'>Header size</div>
        <div className='pb-as-cardsub'>Compact gives your books the most space.</div>
        <div className='pb-as-seg' role='group' aria-label='Header size'>
          {HEADER_SIZES.map((h) => (
            <button
              key={h.id}
              className={clsx(size === h.id && 'on')}
              aria-pressed={size === h.id}
              onClick={() => setSize(h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {SAMPLES.map((s) => {
        const on = size === s.id;
        return (
          <div key={s.id} className={clsx('pb-as-sample', s.id === 'compact' && 'first')}>
            <div className='pb-as-samplehead'>
              <span className='pb-as-name'>{HEADER_SIZES.find((h) => h.id === s.id)?.label}</span>
              {s.note && <span className='pb-as-note'>{s.note}</span>}
              {s.isDefault && <span className='pb-as-badge'>Default</span>}
              {on && <span className='pb-as-badge sel'>Selected</span>}
            </div>
            <div className={clsx('pb-as-box', s.id, on && 'on')}>
              <PageHeader label='Library' size={s.id} preview />
            </div>
          </div>
        );
      })}

      <MenuFab onOpen={() => setMenuOpen(true)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </Shell>
  );
}
