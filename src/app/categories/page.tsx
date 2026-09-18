import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllCategories, stats } from '@/lib/apis';

export const metadata: Metadata = {
  title: 'All API categories',
  description: `Browse ${stats.categories} categories of free public APIs, from weather and finance to machine learning and open government data.`,
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {stats.total.toLocaleString('en-GB')} free APIs sorted into {stats.categories} categories.
          Pick a subject to see everything we have indexed for it.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group rounded-xl border border-border-subtle bg-surface-raised p-5 transition hover:border-accent hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden className="text-2xl">
                {category.emoji}
              </span>
              <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                {category.count}
              </span>
            </div>
            <h2 className="mt-3 font-semibold group-hover:text-accent">{category.name}</h2>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
