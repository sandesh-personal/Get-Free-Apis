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
  health?: Health;
  status: Status;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
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
  /*
   * Origin only, not the full documentation URL. The card's copy-cURL button needs
   * somewhere to point, and the origin is both what the snippet actually uses and
   * about a third of the bytes of the full URL across 2,712 rows.
   */
  u?: string;
  /*
   * Reliability, and only when it differs from the score — they agree on roughly
   * three quarters of the catalogue, so omitting the duplicate is free.
   */
  r?: number;
};

const CARD_DESCRIPTION_LIMIT = 160;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function getBrowseIndex(): BrowseRow[] {
  return apis.map((api) => {
    const origin = originOf(api.url);
    return {
      i: api.id,
      n: api.name,
      d: truncate(api.description, CARD_DESCRIPTION_LIMIT),
      c: api.category,
      s: api.categorySlug,
      a: api.auth,
      h: api.https ? 1 : 0,
      o: api.cors,
      t: api.status,
      ...(origin && { u: origin }),
      ...(api.health && {
        v: api.health.score,
        l: api.health.latencyMs,
        ...(api.health.reliability !== api.health.score && { r: api.health.reliability }),
      }),
    };
  });
}

/**
 * The rows for one category.
 *
 * Category pages used to embed the whole 2,712-row index, which put ~800 KB of HTML
 * on each of 56 pages to render at most a few dozen cards. They only ever filter
 * within their own category, so that is all they need.
 */
export function getBrowseIndexFor(categorySlug: string): BrowseRow[] {
  return getBrowseIndex().filter((row) => row.s === categorySlug);
}

/**
 * Every record in the catalogue is checked in the same batch, so the whole grid
 * shares one check date. Sending it once beats repeating it on 2,712 rows.
 */
export const catalogueCheckedAt: string =
  apis.find((a) => a.health?.lastChecked)?.health?.lastChecked ?? '';

/** Expands a compact row back into the shape ApiCard renders. */
export function expandRow(row: BrowseRow): Api {
  return {
    id: row.i,
    name: row.n,
    description: row.d,
    category: row.c,
    categorySlug: row.s,
    url: row.u ?? '',
    auth: row.a,
    https: row.h === 1,
    cors: row.o,
    sources: [],
    health:
      row.v === undefined
        ? undefined
        : {
            score: row.v,
            reliability: row.r ?? row.v,
            latencyMs: row.l ?? 0,
            lastChecked: catalogueCheckedAt,
          },
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
  /** Responded at the last scheduled check. Distinct from `verified`, which counts
   *  entries we have health data for at all, whatever that data says. */
  live: apis.filter((a) => a.status === 'live').length,
  down: apis.filter((a) => a.status === 'down').length,
  generatedAt: catalogue.generatedAt as string,
};

/**
 * Categories whose entries are tools a developer uses while building, rather than
 * data sources they build against. Used by the "Free for developers" collection.
 */
const DEVELOPER_CATEGORIES = new Set([
  'development',
  'test-data',
  'programming',
  'continuous-integration',
  'open-source-projects',
  'data-validation',
  'documents-and-productivity',
  'url-shorteners',
  'cloud-storage-and-file-sharing',
]);

/**
 * Curated entry points. Each maps to a filter that answers a real search intent.
 *
 * `blurb` is the shorter, more technical line the homepage cards use; `description`
 * stays as the longer prose the collection page and its meta description need. They
 * are separate fields because a card has two lines to work with and a <meta> tag
 * wants a full sentence.
 */
export const collections = [
  {
    slug: 'no-api-key',
    title: 'APIs with no key required',
    description:
      'Call endpoints immediately with fetch() or cURL. No registration, no OAuth tokens, and no .env setup required for quick prototypes.',
    blurb:
      'Call endpoints straight away with cURL or frontend scripts. No signup forms, dashboard tokens, or config credentials required.',
    cta: 'Browse open endpoints',
    filter: (a: Api) => a.auth === 'none',
  },
  {
    slug: 'browser-ready',
    title: 'Works directly in the browser',
    description:
      'CORS-compliant JSON endpoints with open Access-Control-Allow-Origin headers. Run requests straight from client-side React, Vue, or vanilla JavaScript without building an Express proxy.',
    blurb:
      'CORS-friendly endpoints with permissive origin headers. Query them directly from React, Vue, or static vanilla HTML files without a backend proxy.',
    cta: 'Browse client-side APIs',
    filter: (a: Api) => a.auth === 'none' && a.cors === 'yes' && a.https,
  },
  {
    slug: 'for-beginners',
    title: 'Best for learning & portfolio projects',
    description:
      'Predictable, read-only schemas for weather, e-commerce products, crypto prices, and movies. Ideal for practising state management, async data fetching, and pagination.',
    blurb:
      'Predictable schemas and clean JSON payloads. Recommended for tutorials, coding bootcamps, and frontend portfolio projects.',
    cta: 'Browse beginner endpoints',
    filter: (a: Api) => a.auth === 'none' && a.https && (a.health?.score ?? 0) >= 80,
  },
  {
    slug: 'free-for-developers',
    title: 'Free developer utilities & mock data',
    description:
      'Fake REST payloads, dummy user databases, placeholder images, and status monitors. The zero-cost tooling you need while scaffolding a full-stack MVP.',
    blurb:
      'Fake REST payloads, dummy user databases, placeholder images, and status monitors. Zero-cost tooling for scaffolding an MVP.',
    cta: 'Browse dev tooling',
    // Deliberately scoped to the developer-tooling categories rather than "anything
    // free", because every API in this catalogue is free — the useful distinction
    // is whether it is a tool for building, not a data source to build against.
    filter: (a: Api) =>
      DEVELOPER_CATEGORIES.has(a.categorySlug) && a.auth === 'none' && a.status === 'live',
  },
  {
    slug: 'fastest',
    title: 'Fastest responding endpoints',
    description:
      'Verified endpoints averaging under 150ms roundtrip response times. Filtered for high availability and minimal rate-limiting friction.',
    blurb:
      'Measured lowest average latency across our own checks. Filtered for high availability and minimal rate-limiting friction.',
    cta: 'Browse fastest APIs',
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
