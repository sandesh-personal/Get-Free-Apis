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
  title: `${site.name} — ${site.tagline}`,
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
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            {stats.verified.toLocaleString('en-GB')} listings independently verified
          </p>

          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Free public APIs that <span className="text-accent">actually work</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Most API directories are link graveyards. We check ours, publish what we find, and let
            you filter by the things that decide whether an API is usable: key required, CORS, HTTPS.
          </p>

          <div className="mt-8">
            <HomeSearch />
          </div>

          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'APIs indexed', value: stats.total },
              { label: 'No key needed', value: stats.noAuth },
              { label: 'CORS enabled', value: stats.corsEnabled },
              { label: 'Categories', value: stats.categories },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {s.value.toLocaleString('en-GB')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight">Start here</h2>
        <p className="mt-1 text-sm text-muted">
          Shortcuts to the filters people actually need.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group rounded-xl border border-border-subtle bg-surface-raised p-5 transition hover:border-accent hover:shadow-md"
            >
              <span aria-hidden className="text-2xl">
                {collection.emoji}
              </span>
              <h3 className="mt-3 font-semibold group-hover:text-accent">{collection.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{collection.description}</p>
              <p className="mt-3 text-xs font-medium text-accent">
                {getCollectionApis(collection.slug).length.toLocaleString('en-GB')} APIs →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
              <p className="mt-1 text-sm text-muted">
                {stats.categories} categories, from weather to machine learning.
              </p>
            </div>
            <Link href="/categories" className="shrink-0 text-sm font-medium text-accent hover:underline">
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
                <span aria-hidden className="text-xl">
                  {category.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover:text-accent">
                    {category.name}
                  </span>
                  <span className="block text-xs text-muted">{category.count}</span>
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
            <h2 className="text-2xl font-bold tracking-tight">Good places to start</h2>
            <p className="mt-1 text-sm text-muted">
              Verified, no key required, and simple enough to get a response first try.
            </p>
          </div>
          <Link
            href="/collections/for-beginners"
            className="shrink-0 text-sm font-medium text-accent hover:underline"
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
