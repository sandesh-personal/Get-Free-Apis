import catalogue from '@/../data/apis.json';
import categoryData from '@/../data/categories.json';

export type Auth = 'none' | 'apiKey' | 'oauth' | 'other';
export type Cors = 'yes' | 'no' | 'unknown';
export type Status = 'live' | 'down' | 'unchecked';

export type Health = {
  score: number;
  reliability: number;
  latencyMs: number;
  lastChecked: string;
};

export type Api = {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  url: string;
  auth: Auth;
  https: boolean;
  cors: Cors;
  sources: string[];
  emoji?: string;
  health?: Health;
  status: Status;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  count: number;
};

const apis = catalogue.apis as Api[];
const categories = categoryData as Category[];

export function getAllApis(): Api[] {
  return apis;
}

/**
 * Compact row shipped to the browse page.
 *
 * Sending all 2,712 full records serialises to roughly 1.1 MB of HTML, which wrecks
 * Core Web Vitals on the page people spend the most time on. Short keys, dropped
 * fields the card never renders, and truncated descriptions cut that by about 70%.
 * Keys are terse on purpose: at this row count the key names themselves are a
 * meaningful share of the payload.
 */
export type BrowseRow = {
  i: string; // id
  n: string; // name
  d: string; // description, truncated
  c: string; // category display name
  s: string; // category slug
  a: Auth;
  h: 0 | 1; // https
  o: Cors;
  t: Status;
  v?: number; // health score
  l?: number; // average latency, ms
  e?: string; // emoji
};

const CARD_DESCRIPTION_LIMIT = 160;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function getBrowseIndex(): BrowseRow[] {
  return apis.map((api) => ({
    i: api.id,
    n: api.name,
    d: truncate(api.description, CARD_DESCRIPTION_LIMIT),
    c: api.category,
    s: api.categorySlug,
    a: api.auth,
    h: api.https ? 1 : 0,
    o: api.cors,
    t: api.status,
    ...(api.health && { v: api.health.score, l: api.health.latencyMs }),
    ...(api.emoji && { e: api.emoji }),
  }));
}

/** Expands a compact row back into the shape ApiCard renders. */
export function expandRow(row: BrowseRow): Api {
  return {
    id: row.i,
    name: row.n,
    description: row.d,
    category: row.c,
    categorySlug: row.s,
    url: '',
    auth: row.a,
    https: row.h === 1,
    cors: row.o,
    sources: [],
    emoji: row.e,
    health:
      row.v === undefined
        ? undefined
        : { score: row.v, reliability: row.v, latencyMs: row.l ?? 0, lastChecked: '' },
    status: row.t,
  };
}

export function getApi(id: string): Api | undefined {
  return apis.find((a) => a.id === id);
}

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getApisByCategory(slug: string): Api[] {
  return apis.filter((a) => a.categorySlug === slug);
}

/** Same category, excluding the API itself. Powers internal linking on detail pages. */
export function getRelatedApis(api: Api, limit = 6): Api[] {
  const sameCategory = apis.filter((a) => a.categorySlug === api.categorySlug && a.id !== api.id);

  // Prefer entries that are verified and easy to start with.
  return sameCategory
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

function score(api: Api): number {
  let n = 0;
  if (api.health) n += api.health.score;
  if (api.auth === 'none') n += 40;
  if (api.cors === 'yes') n += 20;
  if (api.https) n += 10;
  return n;
}

export const stats = {
  total: apis.length,
  categories: categories.length,
  noAuth: apis.filter((a) => a.auth === 'none').length,
  corsEnabled: apis.filter((a) => a.cors === 'yes').length,
  httpsOnly: apis.filter((a) => a.https).length,
  verified: apis.filter((a) => a.health).length,
  generatedAt: catalogue.generatedAt as string,
};

/** Curated entry points. Each maps to a filter that answers a real search intent. */
export const collections = [
  {
    slug: 'no-api-key',
    title: 'APIs with no key required',
    description:
      'Call these straight away. No sign-up, no dashboard, no key to paste into a config file.',
    emoji: '🔓',
    filter: (a: Api) => a.auth === 'none',
  },
  {
    slug: 'browser-ready',
    title: 'Works directly in the browser',
    description:
      'No key and CORS enabled, so these run from client-side JavaScript without a proxy or a backend.',
    emoji: '🌐',
    filter: (a: Api) => a.auth === 'none' && a.cors === 'yes' && a.https,
  },
  {
    slug: 'for-beginners',
    title: 'Best for learning',
    description:
      'Verified, no key needed, and simple enough to get a response on your first attempt.',
    emoji: '🎓',
    filter: (a: Api) => a.auth === 'none' && a.https && (a.health?.score ?? 0) >= 80,
  },
  {
    slug: 'fastest',
    title: 'Fastest responding',
    description:
      'Measured lowest average latency across our checks. Useful when response time matters.',
    emoji: '⚡',
    filter: (a: Api) => (a.health?.latencyMs ?? Infinity) < 200 && a.status === 'live',
  },
] as const;

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}

export function getCollectionApis(slug: string): Api[] {
  const collection = getCollection(slug);
  if (!collection) return [];
  const matched = apis.filter(collection.filter);
  if (slug === 'fastest') {
    return matched.sort(
      (a, b) => (a.health?.latencyMs ?? Infinity) - (b.health?.latencyMs ?? Infinity),
    );
  }
  return matched.sort((a, b) => score(b) - score(a));
}
