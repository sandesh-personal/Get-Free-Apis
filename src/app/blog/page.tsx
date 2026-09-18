import Link from 'next/link';
import type { Metadata } from 'next';
import { PostCard } from '@/components/PostCard';
import { getAllClusters, getAllPosts, getPostsByCluster } from '@/lib/blog';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Articles on working with free APIs',
  description:
    'Fixing CORS and rate-limit errors, understanding authentication, and choosing the right free API for the job. Written against APIs we actually call and measure.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const clusters = getAllClusters();
  const [lead, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Articles</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Practical writing about consuming APIs. Every article is grounded in requests we actually
          made, with the dates we made them, rather than in a rewrite of someone else&rsquo;s post.
        </p>
      </header>

      {/* Cluster hubs */}
      <nav aria-label="Article categories" className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {clusters.map((cluster) => {
          const count = getPostsByCluster(cluster.slug).length;
          return (
            <Link
              key={cluster.slug}
              href={`/blog/category/${cluster.slug}`}
              className="group rounded-xl border border-border-subtle bg-surface-raised p-5 transition hover:border-accent hover:shadow-md"
            >
              <span aria-hidden className="text-2xl">
                {cluster.emoji}
              </span>
              <h2 className="mt-3 font-semibold group-hover:text-accent">{cluster.name}</h2>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
                {cluster.description}
              </p>
              <p className="mt-3 text-xs font-medium text-accent">
                {count} {count === 1 ? 'article' : 'articles'} →
              </p>
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-medium">No articles published yet</p>
          <p className="mt-1 text-sm text-muted">
            Drop MDX files into <code className="rounded bg-surface px-1.5 py-0.5">content/blog/</code>{' '}
            and they will appear here.
          </p>
        </div>
      ) : (
        <>
          {lead && (
            <section className="mb-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                Latest
              </h2>
              <PostCard post={lead} featured />
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                All articles
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-14 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="font-semibold">Follow along</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          New articles are published as we work through the catalogue. Subscribe with any feed
          reader.
        </p>
        <a
          href={`${site.url}/blog/feed.xml`}
          className="mt-4 inline-block rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
        >
          RSS feed
        </a>
      </section>
    </div>
  );
}
