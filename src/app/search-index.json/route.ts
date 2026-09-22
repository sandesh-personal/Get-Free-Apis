import { getAllApis, getAllCategories, collections } from '@/lib/apis';

/**
 * Typeahead index for the search box.
 *
 * Served as its own static file rather than embedded in the page, because it is
 * roughly 100 KB of names and no visitor needs it until they type. The search box
 * fetches it once, on the first keystroke, and filters in the browser after that —
 * so suggestions are instant and there is no request per letter.
 *
 * Keys are single letters: at 2,700+ rows the key names are a real share of the
 * payload.
 *   t = type (a: api, c: category, k: collection)
 *   n = name
 *   u = href
 *   s = subtitle (category name, or the count for a collection)
 */
export const dynamic = 'force-static';

type Entry = { t: 'a' | 'c' | 'k'; n: string; u: string; s?: string };

export function GET() {
  const entries: Entry[] = [
    ...collections.map((c) => ({
      t: 'k' as const,
      n: c.title,
      u: `/collections/${c.slug}`,
      s: 'Collection',
    })),
    ...getAllCategories().map((c) => ({
      t: 'c' as const,
      n: c.name,
      u: `/categories/${c.slug}`,
      s: `${c.count} APIs`,
    })),
    ...getAllApis().map((a) => ({
      t: 'a' as const,
      n: a.name,
      u: `/apis/${a.id}`,
      s: a.category,
    })),
  ];

  return Response.json(entries, {
    headers: {
      // Immutable in practice: the file is rebuilt with the catalogue.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
