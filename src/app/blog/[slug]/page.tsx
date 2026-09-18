import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/mdx/ArticleBody';
import { MdxContent } from '@/components/mdx/MdxContent';
import { PostCard } from '@/components/PostCard';
import { ApiCard } from '@/components/ApiCard';
import { getApi } from '@/lib/apis';
import { getAuthor } from '@/lib/authors';
import {
  CLUSTERS,
  extractHeadings,
  getAllPosts,
  getPost,
  getRelatedPosts,
} from '@/lib/blog';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Article not found' };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(post.heroImage && { images: [{ url: post.heroImage.src, alt: post.heroImage.alt }] }),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const cluster = CLUSTERS[post.cluster];
  const author = getAuthor(post.author);
  const headings = extractHeadings(post.body);
  const related = getRelatedPosts(post);
  const relatedApis = post.relatedApis
    .map((id) => getApi(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .slice(0, 6);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: `${site.url}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${site.url}/blog/${post.slug}` },
    author: author
      ? { '@type': 'Person', name: author.name, url: `${site.url}/authors/${author.slug}` }
      : { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
    ...(post.heroImage && { image: `${site.url}${post.heroImage.src}` }),
  };

  const faqLd =
    post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }
      : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/blog" className="hover:text-accent">Articles</Link>
          <span aria-hidden>/</span>
          <Link href={`/blog/category/${cluster.slug}`} className="hover:text-accent">
            {cluster.short}
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-[1fr_15rem] lg:gap-12">
          <article className="min-w-0">
            <header className="mb-8">
              <Link
                href={`/blog/category/${cluster.slug}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-muted transition hover:text-accent"
              >
                <span aria-hidden>{cluster.emoji}</span>
                {cluster.name}
              </Link>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {post.title}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-muted">{post.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-5 text-sm">
                {author && (
                  <Link href={`/authors/${author.slug}`} className="font-medium hover:text-accent">
                    {author.name}
                  </Link>
                )}
                <span className="text-muted">
                  Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
                {post.updatedAt !== post.publishedAt && (
                  <span className="text-muted">
                    Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </span>
                )}
                <span className="text-muted">{post.readingMinutes} min read</span>
              </div>
            </header>

            <ArticleBody>
              <MdxContent source={post.body} />
            </ArticleBody>

            {post.faq.length > 0 && (
              <section className="mt-12 border-t border-border-subtle pt-8">
                <h2 className="mb-5 text-2xl font-bold tracking-tight">Common questions</h2>
                <dl className="space-y-5">
                  {post.faq.map((item) => (
                    <div key={item.q} className="rounded-xl border border-border-subtle p-5">
                      <dt className="font-semibold">{item.q}</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-muted-strong">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {post.sources.length > 0 && (
              <section className="mt-10 rounded-xl border border-border-subtle bg-surface p-5">
                <h2 className="text-sm font-semibold">Sources</h2>
                <ul className="mt-3 space-y-1.5">
                  {post.sources.map((source) => (
                    <li key={source.url} className="text-sm">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline underline-offset-2"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {author && (
              <section className="mt-10 rounded-xl border border-border-subtle p-6">
                <h2 className="text-sm font-semibold text-muted">Written by</h2>
                <Link
                  href={`/authors/${author.slug}`}
                  className="mt-2 block text-lg font-semibold hover:text-accent"
                >
                  {author.name}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-muted-strong">{author.bio}</p>
              </section>
            )}
          </article>

          {/* Table of contents */}
          {headings.length > 2 && (
            <aside className="mt-12 hidden lg:mt-0 lg:block">
              <div className="sticky top-24">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  On this page
                </h2>
                <nav aria-label="Table of contents">
                  <ul className="space-y-2 border-l border-border-subtle">
                    {headings.map((heading) => (
                      <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
                        <a
                          href={`#${heading.id}`}
                          className="block border-l-2 border-transparent pl-3 text-sm leading-snug text-muted transition hover:border-accent hover:text-accent"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>

        {relatedApis.length > 0 && (
          <section className="mt-16 border-t border-border-subtle pt-10">
            <h2 className="mb-5 text-xl font-bold tracking-tight">APIs mentioned in this article</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedApis.map((api) => (
                <ApiCard key={api.id} api={api} />
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-bold tracking-tight">Read next</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <PostCard key={r.slug} post={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
