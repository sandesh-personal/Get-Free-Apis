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
import {
  categoryDescription,
  CATEGORY_SLUG_ALIASES,
  CATEGORY_NAME_OVERRIDE,
  API_CATEGORY_OVERRIDE,
  inferCategorySlug,
  titleFromSlug,
} from './lib/categories';
import { canonicalKey, slugify, uniqueSlug } from './lib/normalise';
import {
  ApiSchema,
  CatalogueSchema,
  CategorySchema,
  type Api,
  type Auth,
  type Category,
  type Cors,
  type RawEntry,
} from './lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');

/** Sources listed in descending order of trust for category, auth and CORS fields. */
const PRIORITY: string[] = [
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
  if (!into.sources.includes(next.source)) into.sources.push(next.source);

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

type HealthResult = {
  id: string;
  ok: boolean;
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
  const measuredScore = result.ok ? 100 : 0;

  return {
    ...api,
    // Our own CORS observation beats whatever the upstream lists guessed.
    cors: result.cors !== 'unknown' ? result.cors : api.cors,
    status: result.ok ? 'live' : 'down',
    health: {
      // Blend the upstream reliability history with what we just measured, when we have both.
      score: api.health ? Math.round((api.health.score + measuredScore) / 2) : measuredScore,
      reliability: api.health?.reliability ?? measuredScore,
      latencyMs: result.latencyMs ?? api.health?.latencyMs ?? 0,
      lastChecked: checkedAt,
    },
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

  if (raw.length === 0) throw new Error('every upstream source failed; refusing to write an empty catalogue');

  // Deduplicate on the canonical URL, which strips protocol, www, trailing slash and utm params.
  console.log('\nDeduplicating...');
  const byKey = new Map<string, Merged>();

  for (const entry of raw) {
    const key = canonicalKey(entry.url);
    if (!key) continue;

    const existing = byKey.get(key);
    if (existing) {
      merge(existing, entry);
    } else {
      byKey.set(key, { ...entry, sources: [entry.source] });
    }
  }

  console.log(`  ${raw.length} raw -> ${byKey.size} unique`);

  // Assign slugs and resolve categories.
  const takenSlugs = new Set<string>();
  const categoryNames = new Map<string, string>();
  const healthOverlay = await loadHealthOverlay();
  if (healthOverlay.size) {
    console.log(`  overlaying ${healthOverlay.size} results from our own checks`);
  }

  const apis: Api[] = [...byKey.values()]
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

      return applyHealth(api, healthOverlay.get(id));
    });

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
