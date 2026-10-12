/** Discover's loading state: a coral arc turning on a grey ring, with the label under it. */
export default function PaperbackLoading({ label }: { label: string }) {
  return (
    <div className='pb-loading' role='status'>
      <svg className='pb-spin' width='48' height='48' viewBox='0 0 48 48' fill='none' aria-hidden='true'>
        <circle cx='24' cy='24' r='19' stroke='var(--pb-track)' strokeWidth='5' />
        <path d='M24 5a19 19 0 0 1 19 19' stroke='#F2674A' strokeWidth='5' strokeLinecap='round' />
      </svg>
      <div className='pb-loading-text'>{label.replace(/(\.{3}|…)$/, '…')}</div>
    </div>
  );
}
