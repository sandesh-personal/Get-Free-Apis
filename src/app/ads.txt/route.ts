import { site } from '@/lib/site';

/**
 * Authorised Digital Sellers, served only once we actually have a publisher ID.
 *
 * Google treats an ads.txt containing no valid record as a site declaring it has no
 * authorised sellers, which is a worse signal than having no file at all. So until
 * `site.adsensePublisherId` is set this 404s, which is the neutral state.
 *
 * Set the ID in src/lib/site.ts after approval and this starts serving automatically.
 */
export const dynamic = 'force-static';

export function GET() {
  if (!site.adsensePublisherId) {
    return new Response('Not found', { status: 404 });
  }

  const body = `google.com, ${site.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
