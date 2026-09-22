import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowseClient } from '@/components/BrowseClient';
import { getAllCategories, getBrowseIndex, stats } from '@/lib/apis';

export const metadata: Metadata = {
  title: 'Free Public API List — Search 2,712 APIs',
  description: `Search and filter ${stats.total.toLocaleString('en-GB')} free public APIs by category, authentication, CORS support and HTTPS. Find an API that needs no key in seconds.`,
  alternates: { canonical: '/browse' },
};

/**
 * Only the first screen of rows is server-rendered. The rest arrives from
 * /browse-index.json after mount, which keeps roughly 160 KB of gzipped JSON out of
 * this page's HTML without changing what a crawler sees — the same cards were the
 * only ones rendered before either way.
 */
const FIRST_BATCH = 48;

export default function BrowsePage() {
  const rows = getBrowseIndex()
    .slice()
    .sort((a, b) => a.n.localeCompare(b.n))
    .slice(0, FIRST_BATCH);
  const categories = getAllCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Free public API list</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Every API we have indexed, filterable by the things that decide whether you can actually
          use it. {stats.noAuth.toLocaleString('en-GB')} of these need no API key at all.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted">Loading the catalogue…</p>}>
        <BrowseClient rows={rows} categories={categories} indexUrl="/browse-index.json" />
      </Suspense>
    </div>
  );
}
