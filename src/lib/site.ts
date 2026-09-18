export const site = {
  name: 'GetFreeAPIs',
  domain: 'getfreeapis.com',
  url: 'https://getfreeapis.com',
  tagline: 'Free public APIs, verified and kept current',
  description:
    'Browse thousands of free public APIs, filtered by whether they need an API key, support CORS or run over HTTPS. Every listing is checked automatically so dead links do not waste your time.',
  locale: 'en_GB',
  twitter: '@getfreeapis',
  github: 'https://github.com/getfreeapis',
} as const;

export const nav = [
  { href: '/browse', label: 'Browse' },
  { href: '/categories', label: 'Categories' },
  { href: '/collections', label: 'Collections' },
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
  Learn: [
    { href: '/blog', label: 'Blog' },
    { href: '/blog/category/errors', label: 'Fixing API errors' },
    { href: '/blog/category/fundamentals', label: 'API fundamentals' },
    { href: '/blog/category/roundups', label: 'Best free APIs' },
  ],
  Site: [
    { href: '/about', label: 'About' },
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
