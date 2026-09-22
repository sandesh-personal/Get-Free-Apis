import type { RawEntry } from './types';
import { parseApiMarkdown } from './parse-markdown';
import { cleanText, cleanUrl } from './normalise';

export const SOURCES = {
  publicApis: {
    id: 'public-apis',
    label: 'public-apis/public-apis',
    url: 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md',
  },
  publicApiLists: {
    id: 'public-api-lists',
    label: 'public-api-lists/public-api-lists',
    url: 'https://raw.githubusercontent.com/public-api-lists/public-api-lists/master/README.md',
  },
  freePublicApis: {
    id: 'freepublicapis',
    label: 'freepublicapis.com',
    url: 'https://www.freepublicapis.com/api/apis?limit=1000',
  },
} as const;

const USER_AGENT =
  'getfreeapis.com catalogue builder (+https://getfreeapis.com/about)';

async function get(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res;
}

async function fetchMarkdownSource(
  source: { id: string; url: string },
): Promise<RawEntry[]> {
  const md = await (await get(source.url)).text();
  return parseApiMarkdown(md, source.id);
}

export function fetchPublicApis() {
  return fetchMarkdownSource(SOURCES.publicApis);
}

export function fetchPublicApiLists() {
  return fetchMarkdownSource(SOURCES.publicApiLists);
}

type FreePublicApi = {
  id: number;
  title: string;
  description?: string;
  documentation?: string;
  health?: number;
  avg_reliability?: number;
  avg_latency?: number;
};

/**
 * freepublicapis.com is the only source carrying uptime and latency data, which is the
 * whole trust play. It has no category field, so entries unique to it get a category
 * inferred downstream. Caps at 654 entries regardless of the limit parameter.
 */
export async function fetchFreePublicApis(): Promise<RawEntry[]> {
  const json = (await (await get(SOURCES.freePublicApis.url)).json()) as FreePublicApi[];
  const today = new Date().toISOString().slice(0, 10);

  return json.flatMap((item): RawEntry[] => {
    const url = item.documentation ? cleanUrl(item.documentation) : null;
    if (!url) return [];

    const hasHealth = typeof item.health === 'number';

    return [
      {
        name: cleanText(item.title),
        description: cleanText(item.description ?? ''),
        category: 'Uncategorised',
        url,
        // The source lists only APIs that are free to call, but says nothing about
        // auth or CORS. Leave them unknown rather than inventing a value.
        auth: 'other',
        https: url.startsWith('https://'),
        cors: 'unknown',
        source: SOURCES.freePublicApis.id,
        health: hasHealth
          ? {
              score: clamp(item.health as number),
              reliability: clamp(item.avg_reliability ?? item.health as number),
              latencyMs: Math.max(0, Math.round(item.avg_latency ?? 0)),
              lastChecked: today,
            }
          : undefined,
      },
    ];
  });
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
