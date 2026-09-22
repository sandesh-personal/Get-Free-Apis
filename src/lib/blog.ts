import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { site } from '@/lib/site';

export const CLUSTERS = {
  errors: {
    slug: 'errors',
    name: 'Fixing API errors',
    short: 'Errors',
    description:
      'Something is broken right now. These are the failures developers actually hit, with the real cause and the fix, not a restatement of the error message.',
  },
  fundamentals: {
    slug: 'fundamentals',
    name: 'API fundamentals',
    short: 'Fundamentals',
    description:
      'The concepts worth getting right early: authentication, status codes, pagination, and how to read documentation without getting lost.',
  },
  roundups: {
    slug: 'roundups',
    name: 'Best free APIs',
    short: 'Roundups',
    description:
      'Which free API to use for a given job, chosen with the reliability and latency data from our own daily checks rather than from marketing copy.',
  },
  howto: {
    slug: 'howto',
    name: 'Practical guides',
    short: 'Guides',
    description:
      'Building things: keeping keys out of your bundle, caching to stay inside a free tier, mocking APIs, and handling breaking changes.',
  },
} as const;

export type ClusterSlug = keyof typeof CLUSTERS;
export type Cluster = (typeof CLUSTERS)[ClusterSlug];

export type HeroImage = {
  src: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
};

export type Faq = { q: string; a: string };

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  cluster: ClusterSlug;
  author: string;
  publishedAt: string;
  updatedAt: string;
  heroImage?: HeroImage;
  relatedApis: string[];
  relatedPosts: string[];
  faq: Faq[];
  sources: { label: string; url: string }[];
  readingMinutes: number;
  wordCount: number;
  draft: boolean;
};

export type Post = PostMeta & { body: string };

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

function readAll(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx$/, '');

      // Strip code fences before counting, so a long snippet does not inflate
      // the reading estimate that readers see.
      const prose = content.replace(/```[\s\S]*?```/g, ' ');
      const wordCount = prose.split(/\s+/).filter(Boolean).length;

      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ''),
        cluster: (data.cluster ?? 'fundamentals') as ClusterSlug,
        author: String(data.author ?? 'editorial'),
        publishedAt: String(data.publishedAt ?? ''),
        updatedAt: String(data.updatedAt ?? data.publishedAt ?? ''),
        heroImage: data.heroImage as HeroImage | undefined,
        relatedApis: (data.relatedApis ?? []) as string[],
        relatedPosts: (data.relatedPosts ?? []) as string[],
        faq: (data.faq ?? []) as Faq[],
        sources: (data.sources ?? []) as { label: string; url: string }[],
        readingMinutes: Math.max(1, Math.round(wordCount / 225)),
        wordCount,
        draft: Boolean(data.draft),
        body: content,
      };
    })
    .filter((post) => process.env.NODE_ENV === 'development' || isPublished(post))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * A post is live unless it is a draft, or — when `site.scheduledPublishing` is on —
 * its publish date has not arrived. Compared as YYYY-MM-DD strings so the decision
 * does not shift with the build machine's timezone.
 */
function isPublished(post: Post): boolean {
  if (post.draft) return false;
  if (!site.scheduledPublishing) return true;

  const today = new Date().toISOString().slice(0, 10);
  return !post.publishedAt || post.publishedAt <= today;
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (!cache) cache = readAll();
  return cache;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByCluster(cluster: ClusterSlug): Post[] {
  return getAllPosts().filter((p) => p.cluster === cluster);
}

export function getCluster(slug: string): Cluster | undefined {
  return CLUSTERS[slug as ClusterSlug];
}

export function getAllClusters(): Cluster[] {
  return Object.values(CLUSTERS);
}

export function getPostsByAuthor(authorSlug: string): Post[] {
  return getAllPosts().filter((p) => p.author === authorSlug);
}

/** Explicit related posts first, then siblings from the same cluster. */
export function getRelatedPosts(post: Post, limit = 3): PostMeta[] {
  const explicit = post.relatedPosts
    .map((slug) => getPost(slug))
    .filter((p): p is Post => Boolean(p));

  const siblings = getPostsByCluster(post.cluster).filter(
    (p) => p.slug !== post.slug && !explicit.some((e) => e.slug === p.slug),
  );

  return [...explicit, ...siblings].slice(0, limit);
}

/** Headings for the in-page table of contents, taken straight from the source. */
export function extractHeadings(body: string): { id: string; text: string; level: 2 | 3 }[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  const matches = [...withoutCode.matchAll(/^(#{2,3})\s+(.+)$/gm)];

  return matches.map((m) => ({
    level: m[1].length as 2 | 3,
    text: m[2].replace(/[*_`]/g, '').trim(),
    id: m[2]
      .replace(/[*_`]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-'),
  }));
}
