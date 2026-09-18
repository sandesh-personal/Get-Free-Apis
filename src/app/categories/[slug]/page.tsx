import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiCardGrid } from '@/components/ApiCard';
import { getAllCategories, getApisByCategory, getCategory } from '@/lib/apis';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: 'Category not found' };

  const apis = getApisByCategory(slug);
  const noAuth = apis.filter((a) => a.auth === 'none').length;

  return {
    title: `${category.count} free ${category.name} APIs`,
    description: `${category.description} ${noAuth} of these ${category.count} APIs need no key at all. Each listing shows CORS, HTTPS and current status.`.slice(0, 158),
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      type: 'website',
      title: `${category.count} free ${category.name} APIs`,
      description: category.description,
      url: `${site.url}/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const apis = getApisByCategory(slug).sort((a, b) => {
    // Lead with the ones a visitor can use immediately.
    const rank = (x: typeof a) =>
      (x.auth === 'none' ? 2 : 0) + (x.cors === 'yes' ? 1 : 0) + (x.health ? 1 : 0);
    return rank(b) - rank(a) || a.name.localeCompare(b.name);
  });

  const noAuth = apis.filter((a) => a.auth === 'none').length;
  const corsReady = apis.filter((a) => a.cors === 'yes').length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Free ${category.name} APIs`,
    description: category.description,
    url: `${site.url}/categories/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: apis.length,
      itemListElement: apis.slice(0, 20).map((api, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: api.name,
        url: `${site.url}/apis/${api.id}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/categories" className="hover:text-accent">Categories</Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>

        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <span aria-hidden>{category.emoji}</span>
            Free {category.name} APIs
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
            {category.description}
          </p>
          <p className="mt-3 text-sm text-muted">
            <strong className="text-foreground">{category.count}</strong> listed ·{' '}
            <strong className="text-foreground">{noAuth}</strong> need no key ·{' '}
            <strong className="text-foreground">{corsReady}</strong> work in the browser
          </p>
        </header>

        <ApiCardGrid apis={apis} />

        <section className="mt-12 rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="font-semibold">Looking for something more specific?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Use the full catalogue to combine filters, for example {category.name.toLowerCase()} APIs
            that need no key and support CORS.
          </p>
          <Link
            href={`/browse?category=${category.slug}`}
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
          >
            Filter {category.name} APIs →
          </Link>
        </section>
      </div>
    </>
  );
}
