import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { getAllClusters, getCluster, getPostsByCluster, type ClusterSlug } from '@/lib/blog';
import { site } from '@/lib/site';

type Props = { params: Promise<{ cluster: string }> };

export function generateStaticParams() {
  return getAllClusters().map((cluster) => ({ cluster: cluster.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cluster: slug } = await params;
  const cluster = getCluster(slug);
  if (!cluster) return { title: 'Category not found' };

  return {
    title: cluster.name,
    description: cluster.description.slice(0, 158),
    alternates: { canonical: `/blog/category/${cluster.slug}` },
    openGraph: {
      type: 'website',
      title: cluster.name,
      description: cluster.description,
      url: `${site.url}/blog/category/${cluster.slug}`,
    },
  };
}

export default async function ClusterPage({ params }: Props) {
  const { cluster: slug } = await params;
  const cluster = getCluster(slug);
  if (!cluster) notFound();

  const posts = getPostsByCluster(cluster.slug as ClusterSlug);
  const others = getAllClusters().filter((c) => c.slug !== cluster.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/blog" className="hover:text-accent">Articles</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{cluster.short}</span>
      </nav>

      <header className="mb-10">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <span aria-hidden>{cluster.emoji}</span>
          {cluster.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{cluster.description}</p>
        <p className="mt-3 text-sm text-muted">
          <strong className="text-foreground">{posts.length}</strong>{' '}
          {posts.length === 1 ? 'article' : 'articles'}
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-medium">Nothing published in this category yet</p>
          <Link href="/blog" className="mt-3 inline-block text-sm text-accent hover:underline">
            Browse all articles →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <section className="mt-14 border-t border-border-subtle pt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Other categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {others.map((other) => (
            <Link
              key={other.slug}
              href={`/blog/category/${other.slug}`}
              className="group rounded-xl border border-border-subtle p-4 transition hover:border-accent"
            >
              <span aria-hidden className="text-xl">
                {other.emoji}
              </span>
              <h3 className="mt-2 text-sm font-semibold group-hover:text-accent">{other.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
