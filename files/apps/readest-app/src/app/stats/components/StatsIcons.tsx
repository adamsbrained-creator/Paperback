'use client';

// Icons of the Stats pages, drawn on the same 24 px grid as the mockup (stroke set by .pbs-i in paperback-stats.css).

const PATHS = {
  activity: 'M3 12 7 12 10 4 14 20 17 12 21 12',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7 11M17 6h3v1.5A3.5 3.5 0 0 1 17 11',
  book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2V4zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7V4z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7.5V12l3 2',
  spark:
    'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  flame: 'M12 3c1 3.2 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.7.7-3 1.8-4 .2 1.3.9 2 1.7 2.2C11 8.5 11.2 5.5 12 3z',
  page: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  check: 'M4 12.5 9.5 18 20 6.5',
  done: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M8 12.5l3 3 5-6',
  up: 'M7 17L17 7M9 7h8v8',
  cr: 'M9 5l7 7-7 7',
  cl: 'M15 5l-7 7 7 7',
  cd: 'M6 9l6 6 6-6',
  cu: 'M6 15l6-6 6 6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  info: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 11v5M12 8h.01',
  back: 'M19 12H5M12 5l-7 7 7 7',
} as const;

export type StatsIconName = keyof typeof PATHS;

export function SIcon({ name, size, strokeWidth }: { name: StatsIconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      className='pbs-i'
      viewBox='0 0 24 24'
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      aria-hidden='true'
      focusable='false'
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
