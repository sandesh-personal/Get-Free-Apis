/**
 * Probes every catalogue entry and records what actually happened.
 *
 * This is the part competitors do not do. Most free API directories are scraped copies
 * of the same README where a large share of links 404 and nobody notices. Checking them
 * ourselves produces two things no competitor has: honest status on every listing, and
 * a CORS answer for the ~1,600 entries whose upstream value is "unknown".
 *
 *   npm run health              full run
 *   npm run health -- --limit 50   quick sample
 *   npm run health -- --concurrency 10
 *
 * Be a good citizen: requests are capped, staggered, given a real User-Agent and a short
 * timeout. HEAD is tried before GET so most checks never pull a body.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USER_AGENT =
  'getfreeapis.com health checker (+https://getfreeapis.com/about) - checking whether listed APIs still respond';

const TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 16;

type Result = {
  id: string;
  url: string;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  cors: 'yes' | 'no' | 'unknown';
  redirectedTo?: string;
  error?: string;
  checkedAt: string;
};

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = Number(process.argv[i + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Reads the CORS answer straight off the response rather than trusting upstream metadata. */
function readCors(headers: Headers): 'yes' | 'no' | 'unknown' {
  const allow = headers.get('access-control-allow-origin');
  if (allow === null) return 'no';
  return allow === '*' || allow.length > 0 ? 'yes' : 'no';
}

async function probe(id: string, url: string): Promise<Result> {
  const checkedAt = new Date().toISOString();
  const started = performance.now();

  // Sending an Origin header is what makes a server disclose its CORS policy.
  const headers = { 'User-Agent': USER_AGENT, Origin: 'https://getfreeapis.com', Accept: '*/*' };

  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // Some servers reject HEAD with 405 but answer GET perfectly well.
      if (method === 'HEAD' && (response.status === 405 || response.status === 501)) continue;

      const latencyMs = Math.round(performance.now() - started);
      return {
        id,
        url,
        ok: response.ok,
        httpStatus: response.status,
        latencyMs,
        cors: readCors(response.headers),
        ...(response.url && response.url !== url && { redirectedTo: response.url }),
        checkedAt,
      };
    } catch (error) {
      if (method === 'GET') {
        return {
          id,
          url,
          ok: false,
          httpStatus: null,
          latencyMs: null,
          cors: 'unknown',
          error: error instanceof Error ? error.name : 'unknown error',
          checkedAt,
        };
      }
    }
  }

  return {
    id,
    url,
    ok: false,
    httpStatus: null,
    latencyMs: null,
    cors: 'unknown',
    error: 'no response',
    checkedAt,
  };
}

/** Fixed-size worker pool. Keeps us well under anything that looks like abuse. */
async function pool<T, R>(
  items: T[],
  size: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  let done = 0;

  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
        done++;
        if (onProgress && done % 50 === 0) onProgress(done, items.length);
      }
    }),
  );

  return results;
}

async function main(): Promise<void> {
  const raw = await readFile(path.join(DATA_DIR, 'apis.json'), 'utf8');
  const catalogue = JSON.parse(raw) as { apis: { id: string; url: string }[] };

  const limit = arg('limit', catalogue.apis.length);
  const concurrency = arg('concurrency', DEFAULT_CONCURRENCY);
  const targets = catalogue.apis.slice(0, limit);

  console.log(`Checking ${targets.length} APIs at concurrency ${concurrency}...`);
  const started = Date.now();

  const results = await pool(
    targets,
    concurrency,
    (api) => probe(api.id, api.url),
    (done, total) => console.log(`  ${done}/${total}`),
  );

  const elapsed = Math.round((Date.now() - started) / 1000);
  const ok = results.filter((r) => r.ok);
  const corsYes = results.filter((r) => r.cors === 'yes');
  const latencies = ok.map((r) => r.latencyMs!).filter(Boolean).sort((a, b) => a - b);

  const report = {
    checkedAt: new Date().toISOString(),
    durationSeconds: elapsed,
    total: results.length,
    responding: ok.length,
    failing: results.length - ok.length,
    corsConfirmed: corsYes.length,
    medianLatencyMs: latencies.length ? latencies[Math.floor(latencies.length / 2)] : null,
    results,
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'health.json'), JSON.stringify(report, null, 2) + '\n');

  console.log('\nWrote data/health.json');
  console.log(`  responding:      ${ok.length}/${results.length}`);
  console.log(`  failing:         ${results.length - ok.length}`);
  console.log(`  CORS confirmed:  ${corsYes.length}`);
  console.log(`  median latency:  ${report.medianLatencyMs ?? 'n/a'} ms`);
  console.log(`  elapsed:         ${elapsed}s`);
}

main().catch((err) => {
  console.error('Health check failed:', err);
  process.exit(1);
});
