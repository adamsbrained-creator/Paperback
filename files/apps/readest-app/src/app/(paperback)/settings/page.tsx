'use client';

import { PiBooks, PiCaretRight, PiChartBar, PiCloudArrowUp, PiInfo, PiPalette, PiTarget } from 'react-icons/pi';
import { useAppRouter } from '@/hooks/useAppRouter';
import { navigateToLibrary } from '@/utils/nav';
import Shell from '@/components/paperback/Shell';

export default function SettingsPage() {
  const router = useAppRouter();
  const rows = [
    { icon: PiPalette, label: 'Appearance', sub: 'Light, dark or match system', go: () => router.push('/appearance') },
    { icon: PiTarget, label: 'Reading goals', sub: 'Books, pages, minutes, streak', go: () => router.push('/stats?tab=goals') },
    { icon: PiChartBar, label: 'Reading stats', sub: 'Stats, goals and history', go: () => router.push('/stats') },
    { icon: PiCloudArrowUp, label: 'Backup & restore', sub: 'Save or restore favorites, ratings, wishlist, goals', go: () => router.push('/backup') },
    {
      icon: PiBooks,
      label: 'Library & reader settings',
      sub: 'Import, sync, fonts, layout: Library menu → Settings',
      go: () => navigateToLibrary(router),
    },
    { icon: PiInfo, label: 'About Paperback', sub: 'Credits and licenses', go: () => router.push('/about') },
  ];
  return (
    <Shell title='Settings'>
      <div className='pb-stack'>
        {rows.map((r) => (
          <button key={r.label} className='pb-row pb-rowbtn' onClick={r.go}>
            <div className='pb-iconbox'>
              <r.icon size={22} />
            </div>
            <div className='pb-grow'>
              <div className='pb-title'>{r.label}</div>
              <div className='pb-label'>{r.sub}</div>
            </div>
            <PiCaretRight size={18} />
          </button>
        ))}
      </div>
    </Shell>
  );
}
