/**
 * Paperback logo, option A: "Bookmark p".
 * The letter p, with its stem cut like a ribbon bookmark.
 * Drawn on a 64 × 64 grid with currentColor.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox='0 0 64 64' className={className} aria-hidden='true' focusable='false'>
      <g transform='translate(-5 0)'>
        <path d='M17 6H27V58L22 51L17 58Z' fill='currentColor' />
        <circle cx='37' cy='26' r='15' fill='none' stroke='currentColor' strokeWidth='10' />
      </g>
    </svg>
  );
}

/** The app icon: white mark on a coral rounded square. */
export function LogoTile({
  size = 120,
  radius,
  markSize,
  shadow,
}: {
  size?: number;
  radius?: number;
  markSize?: number;
  shadow?: string;
}) {
  return (
    <div
      className='pb-logotile'
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.225,
        boxShadow: shadow ?? (size >= 96 ? '0 10px 24px rgba(242, 103, 74, 0.3)' : undefined),
      }}
      role='img'
      aria-label='Paperback'
    >
      <LogoMark size={markSize ?? size * 0.633} />
    </div>
  );
}

/** Mark + "paperback" wordmark side by side. */
export function Wordmark({ markSize = 28 }: { markSize?: number }) {
  return (
    <div className='pb-wordmark'>
      <LogoMark size={markSize} />
      <span>paperback</span>
    </div>
  );
}
