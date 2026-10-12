'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { CaretRightIcon } from '@/components/paperback/icons';
import { LogoTile } from '@/components/paperback/Logo';
import MenuFab from '@/components/paperback/MenuFab';
import MenuSheet from '@/components/paperback/MenuSheet';
import PageHeader from '@/components/paperback/PageHeader';
import { useAppRouter } from '@/components/paperback/platform';
import Shell from '@/components/paperback/Shell';
import { useHeaderSize } from '@/components/paperback/useHeaderSize';
import { APP_BUILD, APP_VERSION } from '@/services/paperback/appInfo';

// The design shows two cards that go to their own pages later. Until those exist, each card opens
// in place and shows its text, so nothing from the earlier About page is lost.
const CARDS: { title: string; body: React.ReactNode[] }[] = [
  {
    title: 'Credits',
    body: [
      <>
        Paperback is built on Readest, an open-source ebook reader, and its contributors. Books are rendered with
        foliate-js. Design by you.
      </>,
      <>
        <b>Your data.</b> Your library, notes, highlights and reading stats live on this device. Sync and account
        features inherited from Readest only run if you sign in from the Library menu.
      </>,
    ],
  },
  {
    title: 'Open-source licenses',
    body: [
      <>
        Readest is released under the GNU Affero General Public License v3 (AGPL-3.0), and so is Paperback. The license
        text is the <b>LICENSE</b> file in the app&apos;s source repository, together with <b>NOTICE.md</b>. If you ever
        share this app with anyone else, you must also share its source code under the same license.
      </>,
    ],
  },
];

export default function AboutPage() {
  const router = useAppRouter();
  const [headerSize] = useHeaderSize();
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const header = (
    <PageHeader
      label='About'
      size={headerSize}
      onMenu={() => setMenuOpen(true)}
      onSearch={() => router.push('/search')}
    />
  );

  return (
    <Shell title='About' header={header} wrapClassName='pb-set-wrap'>
      <div className='pb-about-hero'>
        <LogoTile size={104} radius={24} markSize={66} shadow='0 12px 28px rgba(242, 103, 74, 0.32)' />
        <div className='pb-about-word'>paperback</div>
        <div className='pb-about-ver'>
          Version {APP_VERSION} · {APP_BUILD}
        </div>
      </div>

      <div className='pb-about-cards'>
        {CARDS.map((c) => {
          const on = open === c.title;
          return (
            <div key={c.title} className='pb-about-card'>
              <button className='pb-about-cardbtn' aria-expanded={on} onClick={() => setOpen(on ? null : c.title)}>
                <span className='pb-about-cardtitle'>{c.title}</span>
                <CaretRightIcon size={22} className={clsx('pb-about-caret', on && 'open')} />
              </button>
              {on && (
                <div className='pb-about-panel'>
                  {c.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MenuFab onOpen={() => setMenuOpen(true)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </Shell>
  );
}
