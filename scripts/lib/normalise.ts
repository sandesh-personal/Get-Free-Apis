import type { Auth, Cors } from './types';

/**
 * Upstream auth values are a mess. Measured distribution across the public-apis README:
 *   No (868), `apiKey` (802), `OAuth` (150), `X-Mashape-Key` (6), `No` (3), apiKey (3)
 * Backticks, casing and stray whitespace all vary, so normalise aggressively.
 */
export function normaliseAuth(raw: string): Auth {
  const v = raw.replace(/`/g, '').trim().toLowerCase();
  if (v === '' || v === 'no' || v === 'none') return 'none';
  if (v === 'apikey' || v === 'api key' || v === 'key') return 'apiKey';
  if (v === 'oauth' || v === 'oauth2' || v === 'oauth 2.0') return 'oauth';
  return 'other';
}

export function normaliseBool(raw: string): boolean {
  return raw.replace(/`/g, '').trim().toLowerCase() === 'yes';
}

export function normaliseCors(raw: string): Cors {
  const v = raw.replace(/`/g, '').trim().toLowerCase();
  if (v === 'yes') return 'yes';
  if (v === 'no') return 'no';
  return 'unknown';
}

/**
 * Canonical form used purely as a dedupe key. Strips protocol, www, trailing slash,
 * and the utm_* tracking params that the public-apis README sprays on sponsored links.
 */
export function canonicalKey(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return null;
  }
}

/** The URL we actually store and link to: tracking params removed, protocol kept. */
export function cleanUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || key.toLowerCase() === 'ref') {
        u.searchParams.delete(key);
      }
    }
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';
}

/** Collapse whitespace, strip markdown emphasis and stray pipes left by table parsing. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\|/g, ' ')
    .replace(/[*_`]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Deterministic unique slug allocator. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}
