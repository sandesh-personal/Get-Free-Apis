import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { getAllAuthors, getAuthor } from '@/lib/authors';
import { getPostsByAuthor } from '@/lib/blog';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllAuthors().map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return { title: 'Author not found' };

  return {
    title: author.name,
    description: author.bio.slice(0, 158),
    alternates: { canonical: `/authors/${author.slug}` },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  const posts = getPostsByAuthor(author.slug);

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio,
    url: `${site.url}/authors/${author.slug}`,
    jobTitle: author.role,
    ...((author.github || author.website || author.linkedin) && {
      sameAs: [author.github, author.website, author.linkedin].filter(Boolean),
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/blog" className="hover:text-accent">Articles</Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{author.name}</span>
        </nav>

        <header className="mb-10 rounded-xl border border-border-subtle bg-surface-raised p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{author.role}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{author.name}</h1>
          <p className="mt-4 leading-relaxed text-muted-strong">{author.bio}</p>

          <div className="mt-5 border-t border-border-subtle pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Background</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-strong">
              {author.credentials}
            </p>
          </div>

          {(author.github || author.linkedin || author.website) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {author.github && (
                <a
                  href={author.github}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                >
                  GitHub
                </a>
              )}
              {author.linkedin && (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                >
                  LinkedIn
                </a>
              )}
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                >
                  Website
                </a>
              )}
            </div>
          )}
        </header>

        <section>
          <h2 className="mb-5 text-xl font-bold tracking-tight">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </h2>
          {posts.length === 0 ? (
            <p className="text-sm text-muted">Nothing published yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
