import Link from 'next/link';
import { CLUSTERS, type PostMeta } from '@/lib/blog';

export function PostCard({ post, featured = false }: { post: PostMeta; featured?: boolean }) {
  const cluster = CLUSTERS[post.cluster];

  return (
    <article
      className={`group flex h-full flex-col rounded-xl border border-border-subtle bg-surface-raised p-5 transition hover:border-accent hover:shadow-md ${
        featured ? 'sm:p-6' : ''
      }`}
    >
      <Link href={`/blog/category/${cluster.slug}`} className="mb-3 w-fit">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted transition hover:text-accent">
          <span aria-hidden>{cluster.emoji}</span>
          {cluster.short}
        </span>
      </Link>

      <h3 className={`font-semibold leading-snug ${featured ? 'text-xl' : 'text-base'}`}>
        <Link href={`/blog/${post.slug}`} className="group-hover:text-accent">
          {post.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {post.description}
      </p>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} min read</span>
      </p>
    </article>
  );
}
