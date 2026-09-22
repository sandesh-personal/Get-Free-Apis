export const site = {
  name: 'GetFreeAPIs',
  domain: 'getfreeapis.com',
  /**
   * www, not apex: the apex is set up in Vercel/Cloudflare to redirect *into* www
   * (308), so www is the URL that actually serves the page. Every canonical tag,
   * sitemap entry and OG url is built from this, so it must match the live
   * redirect direction rather than the other way round.
   */
  url: 'https://www.getfreeapis.com',
  tagline: '2,700+ Public APIs for Testing & Projects [No Key]',

  /**
   * The exact <title> for the homepage. Kept separate from `name` + `tagline`
   * because the brand is written "GetFreeAPIs" in the wordmark but spaced out in
   * the title, where the three words each carry search weight on their own.
   */
  titleDefault: 'Get Free APIs – 2,700+ Public APIs for Testing & Projects [No Key]',
  description:
    'Browse thousands of free public APIs, filtered by whether they need an API key, support CORS or run over HTTPS. Every listing is checked automatically so dead links do not waste your time.',
  locale: 'en_GB',
  /**
   * Contact routes. These must be real mailboxes before launch — a contact route
   * that bounces fails most ad-network reviews and is worse than none.
   * No postal address is published: this is a one-person project run from no
   * business premises, and inventing one would be worse than omitting it.
   */
  email: 'hello@getfreeapis.com',
  privacyEmail: 'privacy@getfreeapis.com',
  submitEmail: 'submit@getfreeapis.com',

  twitter: '@getfreeapis',

  /**
   * Set this to the `pub-…` ID once AdSense approves the site. Everything ad-related is
   * gated on it: the loader script, and `/ads.txt`. Shipping an ads.txt with no valid
   * record is worse than shipping none at all, because Google reports it as a site with
   * no authorised sellers, so the route 404s until this is filled in.
   */
  adsensePublisherId: null as string | null,

  /**
   * Enforce the publishing cadence in ROADMAP §9, which warns that 50 posts
   * appearing at once "looks automated" — the pattern behind a low-value-content
   * rejection.
   *
   * When true, a post whose `publishedAt` is in the future is treated as scheduled
   * and left out of production builds, so the dates become a real release schedule.
   * Drafts are always hidden; development always shows everything.
   *
   * Left false because the current posts are dated forward to 6 Nov 2026, so
   * switching it on today would hide roughly 40 of the 50. Turn it on once the
   * dates reflect the schedule you actually want, and rebuild on a cron so each
   * post goes live on its date.
   */
  scheduledPublishing: false,
} as const;

export const nav = [
  { href: '/browse', label: 'Browse' },
  { href: '/categories', label: 'Categories' },
  { href: '/tools', label: 'Tools' },
  { href: '/status', label: 'Status' },
  { href: '/blog', label: 'Blog' },
] as const;

export const footerNav = {
  Explore: [
    { href: '/browse', label: 'Browse all APIs' },
    { href: '/categories', label: 'Categories' },
    { href: '/collections', label: 'Collections' },
    { href: '/status', label: 'Live status' },
  ],
  Tools: [
    { href: '/tools/curl-converter', label: 'cURL converter' },
    { href: '/tools/json-formatter', label: 'JSON formatter' },
    { href: '/tools/cors-checker', label: 'CORS checker' },
    { href: '/tools/jwt-decoder', label: 'JWT decoder' },
  ],
  Learn: [
    { href: '/blog', label: 'Blog' },
    { href: '/blog/category/errors', label: 'Fixing API errors' },
    { href: '/blog/category/fundamentals', label: 'API fundamentals' },
    { href: '/blog/category/roundups', label: 'Best free APIs' },
  ],
  Site: [
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
    { href: '/editorial-policy', label: 'Editorial policy' },
    { href: '/contact', label: 'Contact' },
    { href: '/submit', label: 'Submit an API' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/terms', label: 'Terms of use' },
    { href: '/disclaimer', label: 'Disclaimer' },
    { href: '/image-credits', label: 'Image credits' },
  ],
} as const;
