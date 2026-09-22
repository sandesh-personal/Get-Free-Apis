import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiCardGrid } from '@/components/ApiCard';
import { Faq } from '@/components/Faq';
import { collections, getCollection, getCollectionApis } from '@/lib/apis';
import { collectionFaq } from '@/lib/faq';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: 'Collection not found' };

  const count = getCollectionApis(slug).length;

  return {
    title: `${collection.title} — ${count} Free APIs`,
    description: collection.description.slice(0, 158),
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      type: 'website',
      title: `${collection.title} — ${count} free APIs`,
      description: collection.description,
      url: `${site.url}/collections/${collection.slug}`,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const apis = getCollectionApis(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/collections" className="hover:text-accent">Collections</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{collection.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          {collection.title}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          {collection.description}
        </p>
        <p className="mt-3 text-sm text-muted">
          <strong className="text-foreground">{apis.length.toLocaleString('en-GB')}</strong> APIs
          match
        </p>
      </header>

      <ApiCardGrid apis={apis} />

      <Faq items={collectionFaq(collection, apis.length)} />
    </div>
  );
}
