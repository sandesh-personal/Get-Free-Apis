import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ApiCardGrid } from '@/components/ApiCard';
import { BrowseClient } from '@/components/BrowseClient';
import { Faq } from '@/components/Faq';
import { getAllCategories, getApisByCategory, getBrowseIndexFor, getCategory } from '@/lib/apis';
import { categoryFaq } from '@/lib/faq';
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
    title: `Free ${category.name} APIs — ${category.count} Verified`,
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
          <h1 className="text-3xl font-bold tracking-tight">Free {category.name} APIs</h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
            {category.description}
          </p>
          <p className="mt-3 text-sm text-muted">
            <strong className="text-foreground">{category.count}</strong> listed ·{' '}
            <strong className="text-foreground">{noAuth}</strong> need no key ·{' '}
            <strong className="text-foreground">{corsReady}</strong> work in the browser
          </p>
        </header>

        {/* The same interactive view as /browse, pinned to this category, so search,
            sort, shuffle and the auth filters all work here too. */}
        <Suspense fallback={<ApiCardGrid apis={apis.slice(0, 24)} />}>
          <BrowseClient
            rows={getBrowseIndexFor(category.slug)}
            categories={getAllCategories()}
            lockedCategory={category}
          />
        </Suspense>

        {/*
          The browse widget above is a client component, so its cards only exist after
          hydration. This list is server-rendered, which means every API in the category
          is reachable from the HTML — both for crawlers and for anyone without
          JavaScript. It is also just a faster way to find a name you already know.
        */}
        <section className="mt-12 border-t border-border-subtle pt-8">
          <h2 className="text-lg font-semibold">
            All {category.count.toLocaleString('en-GB')} {category.name} APIs
          </h2>
          <ul className="mt-4 columns-2 gap-6 sm:columns-3 lg:columns-4">
            {apis.map((api) => (
              <li key={api.id} className="mb-1.5 break-inside-avoid text-sm">
                <Link href={`/apis/${api.id}`} className="text-muted-strong hover:text-accent">
                  {api.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Faq
          items={categoryFaq(category)}
          heading={`Free ${category.name} APIs — common questions`}
          intro="Counts and timings below come from our own scheduled checks of this category."
        />
      </div>
    </>
  );
}
