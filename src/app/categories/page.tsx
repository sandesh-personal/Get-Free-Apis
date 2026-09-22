import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllCategories, stats } from '@/lib/apis';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free API Categories — 56 Topics',
  description: `Browse ${stats.categories} categories of free public APIs, from AI and weather to finance and open government data.`,
  alternates: { canonical: '/categories' },
};

/**
 * A plain index. Every tile is the category name and nothing else, which makes the
 * whole set scannable in one pass — the point of an index is to get you out of it
 * quickly, and descriptions and counts on 56 tiles work against that.
 *
 * The counts still exist and are answered on each category page.
 */
export default function CategoriesPage() {
  // Alphabetical, not by size. With 56 tiles the only question a reader has is
  // "where is mine", and frequency order makes that a linear search.
  const categories = [...getAllCategories()].sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'API categories',
    url: `${site.url}/categories`,
    hasPart: categories.map((category) => ({
      '@type': 'CollectionPage',
      name: category.name,
      url: `${site.url}/categories/${category.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="inline-block border-b-2 border-border-strong pb-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Free API categories
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {stats.total.toLocaleString('en-GB')} free APIs sorted into {stats.categories}{' '}
            categories. Pick a subject to filter the catalogue down to it.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                className="flex h-full min-h-16 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-center text-sm font-medium shadow-sm transition hover:border-accent hover:text-accent hover:shadow-md focus-visible:border-accent"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
