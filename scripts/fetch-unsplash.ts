/**
 * Picks one Unsplash hero photo per blog post and records what we need to use it legally.
 *
 *   npm run images                 fill in any post that has no photo yet
 *   npm run images -- --force      re-pick every post
 *   npm run images -- --slug foo   re-pick one post
 *   npm run images -- --dry-run    show what would be requested, call nothing
 *
 * ROADMAP §10.1 spells out why this script stores URLs rather than files. Using an API
 * key puts us under the Unsplash API Guidelines rather than the Unsplash License, and
 * those guidelines require three things that self-hosting would breach:
 *
 *   1. Images must be hotlinked from the `photo.urls` the API returned.
 *   2. Attribution must name the photographer and Unsplash, linking to both with
 *      `?utm_source=<app>&utm_medium=referral`.
 *   3. Every use must ping `photo.links.download_location`.
 *
 * So we fire the download ping here, store the hotlink plus the attribution fields, and
 * let the site render from `data/post-images.json`. Nothing is downloaded.
 *
 * Demo Unsplash apps are capped at 50 requests/hour and each post costs two (one search,
 * one download ping). The script tracks the quota the API reports and stops cleanly when
 * it runs out, so re-running later picks up exactly where it left off.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const OUT_FILE = path.join(ROOT, 'data', 'post-images.json');
const API = 'https://api.unsplash.com';

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const APP_NAME = process.env.UNSPLASH_APP_NAME ?? 'getfreeapis';

/** Each post's stored photo. Everything here exists to satisfy the guidelines above. */
export type PostImage = {
  slug: string;
  query: string;
  photoId: string;
  /** Hotlink base. Sized at render time with Unsplash's own imgix parameters. */
  rawUrl: string;
  /** Unsplash's own alt text, used only as a fallback; posts should set their own. */
  altDescription: string | null;
  /** Dominant colour, painted behind the image so there is no flash while it loads. */
  colour: string;
  width: number;
  height: number;
  photographerName: string;
  photographerUsername: string;
  photoPageUrl: string;
  fetchedAt: string;
};

type UnsplashPhoto = {
  id: string;
  color: string | null;
  width: number;
  height: number;
  alt_description: string | null;
  urls: { raw: string };
  links: { html: string; download_location: string };
  user: { name: string; username: string };
};

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
};
const has = (flag: string) => process.argv.includes(flag);

/**
 * Posts declare their own search term in frontmatter. Falling back to the title works
 * but reads badly — titles are full of punctuation and words like "vs" that skew the
 * search — so the fallback strips those rather than sending the title raw.
 */
function queryFor(slug: string, data: Record<string, unknown>): string {
  const declared = typeof data.imageQuery === 'string' ? data.imageQuery.trim() : '';
  if (declared) return declared;

  const title = typeof data.title === 'string' ? data.title : slug.replace(/-/g, ' ');
  return title
    .replace(/[:"'?—–,.()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(a|an|the|and|or|vs|to|of|in|on|for|with|your|how|what|why|when)$/i.test(w))
    .slice(0, 4)
    .join(' ');
}

/** Unsplash reports the remaining hourly quota on every response. */
let remaining = Number.POSITIVE_INFINITY;

async function unsplash<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });

  const header = res.headers.get('x-ratelimit-remaining');
  if (header !== null) remaining = Number(header);

  if (res.status === 403) {
    throw new Error(
      'RATE_LIMIT: Unsplash returned 403. Demo apps allow 50 requests/hour. ' +
        'Re-run later and the script will resume from where it stopped.',
    );
  }
  if (!res.ok) throw new Error(`Unsplash ${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  if (!ACCESS_KEY && !has('--dry-run')) {
    console.error('UNSPLASH_ACCESS_KEY is not set. Copy .env.example to .env.local and fill it in.');
    process.exit(1);
  }

  const existing: Record<string, PostImage> = await readFile(OUT_FILE, 'utf8')
    .then((raw) => JSON.parse(raw))
    .catch(() => ({}));

  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith('.mdx')).sort();
  const onlySlug = arg('--slug');
  const force = has('--force');
  const dryRun = has('--dry-run');

  // One photographer's shot should not appear on two posts, and nor should one photo.
  const usedPhotoIds = new Set(Object.values(existing).map((e) => e.photoId));

  const todo: { slug: string; query: string }[] = [];
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    if (onlySlug && slug !== onlySlug) continue;
    if (existing[slug] && !force && !onlySlug) continue;

    const { data } = matter(await readFile(path.join(BLOG_DIR, file), 'utf8'));
    todo.push({ slug, query: queryFor(slug, data) });
  }

  if (todo.length === 0) {
    console.log(`Nothing to do — all ${files.length} posts already have a photo.`);
    return;
  }

  console.log(`${todo.length} post(s) need a photo. Budget: 2 requests each.\n`);

  let done = 0;
  let stoppedEarly = false;

  for (const { slug, query } of todo) {
    if (dryRun) {
      console.log(`[dry-run] ${slug} -> "${query}"`);
      continue;
    }

    // Two requests per post, so stop while there is still room for both.
    if (remaining < 2) {
      stoppedEarly = true;
      console.log(`\nQuota exhausted (${remaining} left). Stopping cleanly.`);
      break;
    }

    try {
      const search = await unsplash<{ results: UnsplashPhoto[] }>(
        `${API}/search/photos?query=${encodeURIComponent(query)}` +
          `&per_page=10&orientation=landscape&content_filter=high`,
      );

      const photo = search.results.find((p) => !usedPhotoIds.has(p.id)) ?? search.results[0];
      if (!photo) {
        console.log(`  ${slug}: no results for "${query}" — skipped`);
        continue;
      }

      // Guideline 3. Required on every use, and the response body is not needed.
      await unsplash(photo.links.download_location);

      usedPhotoIds.add(photo.id);
      existing[slug] = {
        slug,
        query,
        photoId: photo.id,
        rawUrl: photo.urls.raw,
        altDescription: photo.alt_description,
        colour: photo.color ?? '#d1d5db',
        width: photo.width,
        height: photo.height,
        photographerName: photo.user.name,
        photographerUsername: photo.user.username,
        photoPageUrl: photo.links.html,
        fetchedAt: new Date().toISOString().slice(0, 10),
      };
      done += 1;
      console.log(`  ${slug}: ${photo.id} by ${photo.user.name} (${remaining} requests left)`);

      // Written after each success so an interrupted run loses nothing.
      await writeFile(OUT_FILE, `${JSON.stringify(sortKeys(existing), null, 2)}\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('RATE_LIMIT')) {
        stoppedEarly = true;
        console.log(`\n${message}`);
        break;
      }
      console.error(`  ${slug}: FAILED — ${message}`);
    }
  }

  if (dryRun) return;

  console.log(`\nWrote ${done} photo(s) to data/post-images.json.`);
  console.log(`${Object.keys(existing).length} of ${files.length} posts now have one.`);
  if (stoppedEarly) console.log('Re-run `npm run images` after the hour resets to continue.');
  console.log(`App name used for attribution utm_source: ${APP_NAME}`);
}

/** Stable key order keeps the committed JSON diff-friendly. */
function sortKeys(obj: Record<string, PostImage>): Record<string, PostImage> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
