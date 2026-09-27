/**
 * Builds the API catalogue from every upstream source into static JSON.
 *
 * This runs at build time and never at request time. The reference project this site
 * is modelled on fetched its catalogue from api.publicapis.org on every page load;
 * that host stopped resolving and took the whole site down with it. Committing the
 * output means the site keeps building even if every upstream disappears.
 *
 *   npm run data
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  fetchFreePublicApis,
  fetchPublicApiLists,
  fetchPublicApis,
  SOURCES,
} from './lib/sources';
import { CUSTOM_ENTRIES } from './lib/custom-entries';
import {
  categoryDescription,
  CATEGORY_SLUG_ALIASES,
  CATEGORY_NAME_OVERRIDE,
  API_CATEGORY_OVERRIDE,
  inferCategorySlug,
  titleFromSlug,
} from './lib/categories';
import { canonicalKey, slugify, uniqueSlug } from './lib/normalise';
import { isUp } from './lib/health';
import {
  AccessSchema,
  ApiSchema,
  CatalogueSchema,
  CategorySchema,
  type Access,
  type Api,
  type Auth,
  type Category,
  type Cors,
  type RawEntry,
} from './lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Sources listed in descending order of trust for category, auth and CORS fields.
 * 'custom' leads because those entries are hand-verified rather than scraped.
 */
const PRIORITY: string[] = [
  'custom',
  SOURCES.publicApis.id,
  SOURCES.publicApiLists.id,
  SOURCES.freePublicApis.id,
];

function rank(source: string): number {
  const i = PRIORITY.indexOf(source);
  return i === -1 ? PRIORITY.length : i;
}

/** A definite answer always beats "other". */
function bestAuth(a: Auth, b: Auth): Auth {
  if (a === b) return a;
  if (a === 'other') return b;
  if (b === 'other') return a;
  return a;
}

/** A definite answer always beats "unknown". */
function bestCors(a: Cors, b: Cors): Cors {
  if (a === b) return a;
  if (a === 'unknown') return b;
  if (b === 'unknown') return a;
  return a;
}

type Merged = RawEntry & { sources: string[] };

function merge(into: Merged, next: RawEntry): void {
  // `next` is sometimes itself an already-merged group (see mergeSameVendorDuplicates),
  // which carries multiple sources under `.sources` rather than one under `.source`.
  const incomingSources = 'sources' in next ? (next as Merged).sources : [next.source];
  for (const src of incomingSources) {
    if (!into.sources.includes(src)) into.sources.push(src);
  }

  const incomingWins = rank(next.source) < rank(into.source);

  if (incomingWins && next.category !== 'Uncategorised') {
    into.category = next.category;
    into.source = next.source;
    into.name = next.name;
  }

  into.auth = bestAuth(into.auth, next.auth);
  into.cors = bestCors(into.cors, next.cors);
  into.https = into.https || next.https;

  // Keep the most informative description rather than whichever arrived first.
  if (next.description.length > into.description.length) into.description = next.description;

  // Health only ever comes from freepublicapis, so take it wherever found.
  if (next.health && !into.health) into.health = next.health;
}

/**
 * Known duplicates that neither dedup pass below can catch automatically: same
 * product, same vendor, but the two upstream listings gave it different enough names
 * (e.g. "5DollarFootball" vs "5Dollar Football API") that the same-vendor merge's
 * name match doesn't fire, so an exact-URL alias is the only sure fix. Reported by a
 * reader on Reddit for this exact pair — add more here as they turn up, rather than
 * loosening the name match and risking false merges elsewhere.
 */
const DUPLICATE_KEY_ALIASES: Record<string, string> = {
  '5dollarfootballapi.com/docs': '5dollarfootballapi.com',
};

/**
 * Hosts excluded from the same-vendor merge below: multi-tenant platforms where one
 * domain legitimately hosts many unrelated APIs, so "same host" carries no signal.
 * Discovered the hard way — two different l0v3m0n3y GitHub repos both happened to be
 * named "Temporary Email API" by their upstream listing and nearly got merged.
 */
const MULTI_TENANT_HOSTS = new Set([
  'github.com',
  'gitlab.com',
  'app.swaggerhub.com',
  'sampleapis.com',
]);

/**
 * Catches the duplicate the exact-URL dedup above can't: two upstream sources linking
 * different pages of the *same* product on the *same* vendor's own domain (a docs page
 * vs the homepage, a v1 vs v2 reference). Exact-URL dedup treats those as two APIs; this
 * pass recognises "same host, same normalised name" as one API listed twice.
 *
 * Deliberately narrower than merging on host alone — most shared hosts in this
 * catalogue are platforms like sampleapis.com or github.com hosting many genuinely
 * different APIs, where that would wrongly collapse unrelated entries.
 */
function mergeSameVendorDuplicates(entries: Merged[]): Merged[] {
  const byIdentity = new Map<string, Merged>();
  const passthrough: Merged[] = [];

  for (const entry of entries) {
    let host: string;
    try {
      host = new URL(entry.url).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      passthrough.push(entry);
      continue;
    }

    if (MULTI_TENANT_HOSTS.has(host)) {
      passthrough.push(entry);
      continue;
    }

    const identity = `${host}::${slugify(entry.name)}`;
    const existing = byIdentity.get(identity);
    if (existing) {
      merge(existing, entry);
    } else {
      byIdentity.set(identity, entry);
    }
  }

  return [...byIdentity.values(), ...passthrough];
}

type HealthResult = {
  id: string;
  ok: boolean;
  httpStatus?: number | null;
  latencyMs: number | null;
  cors: 'yes' | 'no' | 'unknown';
  checkedAt: string;
};

/**
 * Overlays results from our own probes onto the catalogue.
 *
 * This is the step that makes the site worth more than the lists it aggregates.
 * Upstream marks most entries' CORS support as unknown; we send a real request with an
 * Origin header and read the answer off the response, so our value overrides theirs.
 */
async function loadHealthOverlay(): Promise<Map<string, HealthResult>> {
  try {
    const raw = await readFile(path.join(DATA_DIR, 'health.json'), 'utf8');
    const report = JSON.parse(raw) as { results: HealthResult[] };
    return new Map(report.results.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

function applyHealth(api: Api, result: HealthResult | undefined): Api {
  if (!result) return api;

  const checkedAt = result.checkedAt.slice(0, 10);
  const up = isUp(result);
  const measuredScore = up ? 100 : 0;

  return {
    ...api,
    // Our own CORS observation beats whatever the upstream lists guessed.
    cors: result.cors !== 'unknown' ? result.cors : api.cors,
    status: up ? 'live' : 'down',
    health: {
      // Blend the upstream reliability history with what we just measured, when we have both.
      score: api.health ? Math.round((api.health.score + measuredScore) / 2) : measuredScore,
      reliability: api.health?.reliability ?? measuredScore,
      latencyMs: result.latencyMs ?? api.health?.latencyMs ?? 0,
      lastChecked: checkedAt,
    },
  };
}

/**
 * Loads the hand-verified access facts. A malformed entry fails the build rather than
 * shipping a wrong "free" claim, which is exactly what this file exists to prevent.
 * Keys starting with "$" are notes for editors and are skipped.
 */
async function loadAccess(): Promise<Map<string, Access>> {
  const raw = JSON.parse(await readFile(path.join(DATA_DIR, 'access.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  return new Map(
    Object.entries(raw)
      .filter(([id]) => !id.startsWith('$'))
      .map(([id, value]) => [id, AccessSchema.parse(value)]),
  );
}

/**
 * Applies verified corrections last, so they win over both upstream and our probes:
 * a shut-down API whose docs URL now redirects to a marketing page still answers 200,
 * and only a human can tell that apart from a working API.
 */
function applyAccess(api: Api, access: Access | undefined): Api {
  if (!access) return api;
  return {
    ...api,
    ...(access.auth && { auth: access.auth }),
    ...(access.url && { url: access.url }),
    ...(access.pricing === 'discontinued' && { status: 'discontinued' as const }),
    access,
  };
}

async function main(): Promise<void> {
  console.log('Fetching upstream sources...');

  const settled = await Promise.allSettled([
    fetchPublicApis(),
    fetchPublicApiLists(),
    fetchFreePublicApis(),
  ]);

  const labels = [SOURCES.publicApis.id, SOURCES.publicApiLists.id, SOURCES.freePublicApis.id];
  const raw: RawEntry[] = [];
  const counts: Record<string, number> = {};

  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      counts[labels[i]] = result.value.length;
      raw.push(...result.value);
      console.log(`  ${labels[i]}: ${result.value.length} entries`);
    } else {
      counts[labels[i]] = 0;
      console.error(`  ${labels[i]}: FAILED - ${result.reason}`);
    }
  });

  raw.push(...CUSTOM_ENTRIES);
  counts.custom = CUSTOM_ENTRIES.length;
  console.log(`  custom: ${CUSTOM_ENTRIES.length} entries`);

  if (raw.length === 0) throw new Error('every upstream source failed; refusing to write an empty catalogue');

  // Deduplicate on the canonical URL, which strips protocol, www, trailing slash and utm params.
  console.log('\nDeduplicating...');
  const byKey = new Map<string, Merged>();

  for (const entry of raw) {
    const rawKey = canonicalKey(entry.url);
    const key = rawKey ? (DUPLICATE_KEY_ALIASES[rawKey] ?? rawKey) : null;
    if (!key) continue;

    const existing = byKey.get(key);
    if (existing) {
      merge(existing, entry);
    } else {
      byKey.set(key, { ...entry, sources: [entry.source] });
    }
  }

  console.log(`  ${raw.length} raw -> ${byKey.size} url-unique`);

  const deduped = mergeSameVendorDuplicates([...byKey.values()]);
  console.log(`  ${byKey.size} url-unique -> ${deduped.length} after same-vendor merge`);

  // Assign slugs and resolve categories.
  const takenSlugs = new Set<string>();
  const categoryNames = new Map<string, string>();
  const healthOverlay = await loadHealthOverlay();
  const accessOverlay = await loadAccess();
  if (healthOverlay.size) {
    console.log(`  overlaying ${healthOverlay.size} results from our own checks`);
  }

  const apis: Api[] = deduped
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry): Api => {
      const id = uniqueSlug(slugify(entry.name), takenSlugs);

      const rawSlug =
        entry.category === 'Uncategorised'
          ? inferCategorySlug(entry.name, entry.description)
          : slugify(entry.category);

      // Per-entry override wins, then the slug alias, then whatever upstream said.
      const categorySlug =
        API_CATEGORY_OVERRIDE[id] ?? CATEGORY_SLUG_ALIASES[rawSlug] ?? rawSlug;

      const categoryName =
        CATEGORY_NAME_OVERRIDE[categorySlug] ??
        (entry.category === 'Uncategorised' || categorySlug !== rawSlug
          ? titleFromSlug(categorySlug)
          : entry.category);

      if (!categoryNames.has(categorySlug)) categoryNames.set(categorySlug, categoryName);

      const api: Api = {
        id,
        name: entry.name,
        description: entry.description || `${entry.name}, a free public API.`,
        category: categoryNames.get(categorySlug)!,
        categorySlug,
        url: entry.url,
        auth: entry.auth,
        https: entry.https,
        cors: entry.cors,
        sources: entry.sources.sort(),
        health: entry.health,
        status: entry.health ? (entry.health.score >= 50 ? 'live' : 'down') : 'unchecked',
      };

      return applyAccess(applyHealth(api, healthOverlay.get(id)), accessOverlay.get(id));
    });

  // An access entry keyed to a slug that no longer exists would silently stop
  // correcting anything, so a renamed or removed slug fails loudly instead.
  const ids = new Set(apis.map((a) => a.id));
  const orphaned = [...accessOverlay.keys()].filter((id) => !ids.has(id));
  if (orphaned.length) throw new Error(`data/access.json has entries for unknown ids: ${orphaned.join(', ')}`);
  for (const [id, access] of accessOverlay) {
    const missing = (access.alternatives ?? []).filter((alt) => !ids.has(alt));
    if (missing.length) throw new Error(`data/access.json: ${id} lists unknown alternatives: ${missing.join(', ')}`);
  }
  console.log(`  applied ${accessOverlay.size} hand-verified access entries`);

  // Validate before writing so a malformed upstream cannot poison a build.
  console.log('\nValidating...');
  const invalid: string[] = [];
  for (const api of apis) {
    const result = ApiSchema.safeParse(api);
    if (!result.success) invalid.push(`${api.id}: ${result.error.issues[0]?.message}`);
  }
  if (invalid.length) {
    console.error(`  ${invalid.length} invalid entries:`);
    invalid.slice(0, 10).forEach((m) => console.error(`    ${m}`));
    throw new Error('validation failed');
  }
  console.log(`  ${apis.length} entries valid`);

  const categories: Category[] = [...categoryNames.entries()]
    .map(([slug, name]): Category => ({
      slug,
      name,
      description: categoryDescription(slug, name),
      count: apis.filter((a) => a.categorySlug === slug).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  categories.forEach((c) => CategorySchema.parse(c));

  const catalogue = CatalogueSchema.parse({
    generatedAt: new Date().toISOString(),
    total: apis.length,
    sources: counts,
    apis,
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'apis.json'), JSON.stringify(catalogue, null, 2) + '\n');
  await writeFile(
    path.join(DATA_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2) + '\n',
  );

  // Summary
  const noAuth = apis.filter((a) => a.auth === 'none').length;
  const cors = apis.filter((a) => a.cors === 'yes').length;
  const withHealth = apis.filter((a) => a.health).length;

  console.log('\nWrote data/apis.json and data/categories.json');
  console.log(`  total:           ${apis.length}`);
  console.log(`  categories:      ${categories.length}`);
  console.log(`  no auth needed:  ${noAuth}`);
  console.log(`  CORS enabled:    ${cors}`);
  console.log(`  with health:     ${withHealth}`);
  console.log(`  CORS unknown:    ${apis.filter((a) => a.cors === 'unknown').length}`);
}

main().catch((err) => {
  console.error('\nBuild failed:', err);
  process.exit(1);
});
