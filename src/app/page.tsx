import Link from 'next/link';
import type { Metadata } from 'next';
import { HomeSearch } from '@/components/HomeSearch';
import { ApiCardGrid } from '@/components/ApiCard';
import {
  collections,
  getAllCategories,
  getCollectionApis,
  stats,
} from '@/lib/apis';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: site.titleDefault,
  description: site.description,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const categories = getAllCategories().slice(0, 12);
  const featured = getCollectionApis('for-beginners').slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/browse?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="border-b border-border-subtle bg-surface">
        {/* Sits close under the header: the hero band already separates itself by tone. */}
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:pb-16 sm:pt-10">
          <div className="max-w-3xl">
            <h1 className="type-h1 text-balance">
              Free public APIs that <span className="text-accent">actually work</span>
            </h1>

            {/* The three filter terms are emphasised, but the wording is untouched. */}
            <p className="type-lead mt-3 text-pretty text-muted">
              Search 2,700+ tested public APIs and mock data feeds for fast prototyping. Instant
              filters for <strong className="font-medium text-foreground">no-auth endpoints</strong>,{' '}
              <strong className="font-medium text-foreground">browser-ready CORS support</strong>,
              and <strong className="font-medium text-foreground">active HTTPS</strong>.
              Health-checked every 24 hours to weed out dead links and broken endpoints.
            </p>

            <div className="mt-6">
              <HomeSearch />
            </div>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'APIs indexed', value: stats.total },
              { label: 'No key needed', value: stats.noAuth },
              { label: 'CORS enabled', value: stats.corsEnabled },
              { label: 'Categories', value: stats.categories },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                <dt className="type-stat-label text-muted">{s.label}</dt>
                <dd className="type-stat tabular-nums">{s.value.toLocaleString('en-GB')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Collections */}
      <section id="shortcuts" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="type-h2">Start here</h2>
        <p className="type-subtitle mt-1 text-muted">
          Filter by development environment and authentication limits.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {collections.map((collection) => {
            const count = getCollectionApis(collection.slug).length;
            return (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="group flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm transition hover:border-accent hover:bg-surface"
              >
                <div>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="type-card-title transition-colors group-hover:text-accent">
                      {collection.title}
                    </h3>
                    <span className="type-badge shrink-0 rounded bg-accent-soft px-2 py-0.5 font-mono text-accent">
                      {count.toLocaleString('en-GB')} APIs
                    </span>
                  </div>
                  <p className="type-card-body text-muted">{collection.blurb}</p>
                </div>
                <span className="type-badge mt-3 flex items-center gap-1 text-accent">
                  {collection.cta} →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="type-h2">Browse by category</h2>
              <p className="type-subtitle mt-1 text-muted">
                {stats.categories} categories, from AI and weather to open government data.
              </p>
            </div>
            <Link href="/categories" className="type-nav shrink-0 text-accent hover:underline">
              See all →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3 transition hover:border-accent"
              >
                <span className="min-w-0">
                  <span className="type-card-title block truncate group-hover:text-accent">
                    {category.name}
                  </span>
                  <span className="type-meta block text-muted">{category.count}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="type-h2">Good places to start</h2>
            <p className="type-subtitle mt-1 text-muted">
              Verified, no key required, and simple enough to get a response first try.
            </p>
          </div>
          <Link
            href="/collections/for-beginners"
            className="type-nav shrink-0 text-accent hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="mt-6">
          <ApiCardGrid apis={featured} />
        </div>
      </section>
    </>
  );
}
