import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowseClient } from '@/components/BrowseClient';
import { getAllCategories, getBrowseIndex, stats } from '@/lib/apis';

export const metadata: Metadata = {
  title: 'Browse all free public APIs',
  description: `Search and filter ${stats.total.toLocaleString('en-GB')} free public APIs by category, authentication, CORS support and HTTPS. Find an API that needs no key in seconds.`,
  alternates: { canonical: '/browse' },
};

export default function BrowsePage() {
  const rows = getBrowseIndex();
  const categories = getAllCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Browse free APIs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Every API we have indexed, filterable by the things that decide whether you can actually
          use it. {stats.noAuth.toLocaleString('en-GB')} of these need no API key at all.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted">Loading the catalogue…</p>}>
        <BrowseClient rows={rows} categories={categories} />
      </Suspense>
    </div>
  );
}
