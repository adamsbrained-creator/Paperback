'use client';

/** A bottom sheet over a dimmed screen. Render it inside a `.pb-root` so it picks up the theme. */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className='pb-scrim' onClick={onClose}>
      <div className='pb-sheet' role='dialog' aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className='pb-sheet-grab' />
        <div className='pb-sheet-head'>
          <div className='pb-title'>{title}</div>
          <button className='pb-iconbtn' aria-label='Close' onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
