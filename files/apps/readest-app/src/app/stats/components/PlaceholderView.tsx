'use client';

import { SIcon } from './StatsIcons';
import { STATS_PAGES, type StatsPage } from './StatsNav';

/** A Stats page that is not built yet (Milestones, Books, History, Insights): an empty page for the future. */
export default function PlaceholderView({ page }: { page: StatsPage }) {
  const meta = STATS_PAGES.find((p) => p.id === page)!;
  return (
    <section className='pbs-card pbs-empty' aria-label={meta.label}>
      <SIcon name={meta.icon} />
      <h2>{meta.label}</h2>
      <p>This page is empty for now. It will fill up in a later version.</p>
    </section>
  );
}
