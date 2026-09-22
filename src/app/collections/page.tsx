import Link from 'next/link';
import type { Metadata } from 'next';
import { collections, getCollectionApis } from '@/lib/apis';

export const metadata: Metadata = {
  title: 'Free API Collections — No Key, Browser-Ready',
  description:
    'Hand-picked shortcuts into the catalogue: APIs with no key, APIs that work straight from the browser, the best ones for learning, and the fastest responders.',
  alternates: { canonical: '/collections' },
};

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Free API collections</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Filters worth saving. Each collection answers a question people actually ask, rather than
          slicing the catalogue by subject.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="group rounded-xl border border-border-subtle bg-surface-raised p-6 transition hover:border-accent hover:shadow-md"
          >
            <span aria-hidden className="text-3xl">
            </span>
            <h2 className="mt-4 text-lg font-semibold group-hover:text-accent">
              {collection.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{collection.description}</p>
            <p className="mt-4 text-sm font-medium text-accent">
              {getCollectionApis(collection.slug).length.toLocaleString('en-GB')} APIs →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
