'use client';

import { useState } from 'react';
import {
  AboutIcon,
  AppStyleIcon,
  BackupIcon,
  CaretRightIcon,
  GoalsIcon,
  LibraryIcon,
  ReaderIcon,
  StatsIcon,
  ThemeIcon,
} from '@/components/paperback/icons';
import { navigateToLibrary, useAppRouter, useThemeStore } from '@/components/paperback/platform';
import MenuFab from '@/components/paperback/MenuFab';
import MenuSheet from '@/components/paperback/MenuSheet';
import PageHeader from '@/components/paperback/PageHeader';
import Shell from '@/components/paperback/Shell';
import { useDailyGoal, useGoalMinutes } from '@/components/paperback/useDailyGoal';
import { useHeaderSize } from '@/components/paperback/useHeaderSize';
import { APP_VERSION } from '@/services/paperback/appInfo';
import { headerSizeLabel } from '@/services/paperback/headerSize';

// Placeholders: these values aren't wired to real settings yet, they only keep the design's look.
const READER_DEFAULTS_VALUE = 'Roboto · 16'; // later: the reader's default font and size
const LIBRARY_VALUE = 'Import, sync';

interface RowDef {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value?: string;
  go: () => void;
}

function Group({ label, rows }: { label?: string; rows: RowDef[] }) {
  return (
    <>
      {label && <div className='pb-set-sec'>{label}</div>}
      <div className={label ? 'pb-set-list' : 'pb-set-list pb-set-solo'}>
        {rows.map((r) => (
          <button key={r.title} className='pb-set-row' onClick={r.go}>
            <span className='pb-set-ico'>
              <r.icon size={22} />
            </span>
            <span className='pb-set-title'>{r.title}</span>
            {r.value ? <span className='pb-set-val'>{r.value}</span> : null}
            <CaretRightIcon size={18} strokeWidth={2} className='pb-set-caret' />
          </button>
        ))}
      </div>
    </>
  );
}

/** Daily goal: ring + "0 of 30 min today" + Edit. */
function GoalCard({ onEdit }: { onEdit: () => void }) {
  const { goalMinutes, seconds } = useDailyGoal();
  const minutes = Math.floor(seconds / 60);
  const fraction = Math.max(0, Math.min(1, seconds / 60 / goalMinutes));
  const pct = Math.round(fraction * 100);
  const circumference = 2 * Math.PI * 23;
  return (
    <div className='pb-set-goal'>
      <div className='pb-set-ring'>
        <svg width='56' height='56' viewBox='0 0 56 56' aria-hidden='true'>
          <circle cx='28' cy='28' r='23' fill='none' stroke='#3A3A3A' strokeWidth='7' />
          {pct > 0 ? (
            <circle
              cx='28'
              cy='28'
              r='23'
              fill='none'
              stroke='#F2674A'
              strokeWidth='7'
              strokeLinecap='round'
              strokeDasharray={`${circumference * fraction} ${circumference}`}
              transform='rotate(-90 28 28)'
            />
          ) : (
            <circle cx='28' cy='5' r='4.5' fill='#F2674A' />
          )}
        </svg>
        <div className='pb-set-pct'>{pct}%</div>
      </div>
      <div className='pb-set-goaltext'>
        <div className='pb-set-goaltitle'>Daily goal</div>
        <div className='pb-set-goalsub'>
          {minutes} of {goalMinutes} min today
        </div>
      </div>
      <button className='pb-set-edit' onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useAppRouter();
  const { themeMode } = useThemeStore();
  const [headerSize] = useHeaderSize();
  const [menuOpen, setMenuOpen] = useState(false);
  const appearance = themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'Match system';
  const goalMinutes = useGoalMinutes();

  const reading: RowDef[] = [
    { icon: GoalsIcon, title: 'Reading goals', value: `${goalMinutes} min a day`, go: () => router.push('/stats?tab=goals') },
    { icon: StatsIcon, title: 'Reading stats', go: () => router.push('/stats') },
    // Reader font, layout and sync live in Readest's own settings, reached through its library.
    { icon: ReaderIcon, title: 'Reader defaults', value: READER_DEFAULTS_VALUE, go: () => navigateToLibrary(router) },
  ];
  const look: RowDef[] = [
    { icon: ThemeIcon, title: 'Appearance', value: appearance, go: () => router.push('/appearance') },
    { icon: AppStyleIcon, title: 'App style', value: `Header: ${headerSizeLabel(headerSize)}`, go: () => router.push('/app-style') },
  ];
  const library: RowDef[] = [
    { icon: LibraryIcon, title: 'Library & import', value: LIBRARY_VALUE, go: () => router.push('/import') },
    { icon: BackupIcon, title: 'Backup & restore', go: () => router.push('/backup') },
  ];
  const about: RowDef[] = [
    { icon: AboutIcon, title: 'About Paperback', value: APP_VERSION, go: () => router.push('/about') },
  ];

  const header = (
    <PageHeader
      label='Settings'
      size={headerSize}
      onMenu={() => setMenuOpen(true)}
      onSearch={() => router.push('/search')}
    />
  );

  return (
    <Shell title='Settings' header={header} wrapClassName='pb-set-wrap'>
      <GoalCard onEdit={() => router.push('/stats?tab=goals')} />
      <Group label='READING' rows={reading} />
      <Group label='LOOK' rows={look} />
      <Group label='LIBRARY' rows={library} />
      <Group rows={about} />

      <MenuFab onOpen={() => setMenuOpen(true)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </Shell>
  );
}
