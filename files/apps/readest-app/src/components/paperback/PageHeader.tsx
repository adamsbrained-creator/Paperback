'use client';

import type { HeaderSize } from '@/services/paperback/headerSize';
import { MenuIcon, SearchIcon } from './icons';

// Header design: three sizes (App style → Header size).
const SIZES = {
  compact: { btn: 44, round: false, word: 20, top: 2, col: 44 },
  regular: { btn: 40, round: true, word: 24, top: 6, col: 44 },
  large: { btn: 46, round: true, word: 30, top: 12, col: 46 },
} as const;

/**
 * Menu button · "paperback" · search, then the screen's label (and an optional chip) underneath.
 * The menu sheet is owned by the screen, so the header and its floating menu button share one.
 */
export default function PageHeader({
  label,
  chip,
  size = 'regular',
  onMenu,
  onSearch,
  preview = false,
}: {
  label: string;
  chip?: string;
  size?: HeaderSize;
  onMenu?: () => void;
  onSearch?: () => void;
  /** A static sample (App style): not tappable, hidden from screen readers. */
  preview?: boolean;
}) {
  const s = SIZES[size];
  const left = size === 'compact';
  return (
    <div className={`pb-ph pb-ph-${size}${preview ? ' pb-ph-static' : ''}`} aria-hidden={preview || undefined}>
      <div className='pb-ph-bar' style={{ gridTemplateColumns: `${s.col}px minmax(0, 1fr) ${s.col}px` }}>
        <button
          className='pb-ph-btn'
          style={{ width: s.btn, height: s.btn, ...(s.round ? {} : { background: 'transparent', borderRadius: 0 }) }}
          aria-label='Open library menu'
          tabIndex={preview ? -1 : undefined}
          onClick={onMenu}
        >
          <MenuIcon size={22} />
        </button>
        <div className='pb-ph-word' style={{ fontSize: s.word, textAlign: left ? 'left' : 'center' }}>
          paperback
        </div>
        <button
          className='pb-ph-btn'
          style={{ width: s.btn, height: s.btn, ...(s.round ? {} : { background: 'transparent', borderRadius: 0 }) }}
          aria-label='Search'
          tabIndex={preview ? -1 : undefined}
          onClick={onSearch}
        >
          <SearchIcon size={22} />
        </button>
      </div>
      <div className='pb-ph-label' style={{ paddingTop: s.top }}>
        <div className='pb-ph-title'>{label}</div>
        {chip ? (
          <div className='pb-ph-chip'>
            <span className='pb-ph-dot' />
            {chip}
          </div>
        ) : null}
      </div>
    </div>
  );
}
