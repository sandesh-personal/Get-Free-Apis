import { getBrowseIndex } from '@/lib/apis';

/**
 * The full browse index, as its own static file.
 *
 * It used to be serialised into /browse itself, which made that page ~800 KB of HTML
 * (~173 KB gzipped) before a single card was visible — most of it rows the visitor
 * never scrolls to. Serving it separately lets the page paint from a small
 * server-rendered first batch and pull the rest in the background, and lets the
 * browser cache the index across visits instead of re-downloading it inside a
 * different HTML document every time.
 */
export const dynamic = 'force-static';

export function GET() {
  return Response.json(getBrowseIndex(), {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
