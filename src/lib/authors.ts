/**
 * Authors.
 *
 * Google's helpful-content guidance singles out authorship: readers should be able to
 * see who wrote something and why they are worth listening to. A missing or generic
 * byline is one of the most common reasons an ad network rejects a site.
 *
 * The credentials line has to be something a sceptical reader could verify, so it
 * names shipped work rather than asserting expertise.
 */

export type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  credentials: string;
  avatar?: string;
  /**
   * Shown on the author profile only, never in the site chrome. Leave it out
   * entirely rather than guessing a handle: a profile link that 404s is a worse
   * trust signal than no link, and it is the sort of thing an ad-network review
   * clicks on.
   */
  github?: string;
  linkedin?: string;
  website?: string;
};

export const authors: Author[] = [
  {
    slug: 'sandy',
    name: 'Sandy',
    role: 'Founder and developer',
    bio: 'I build and run this site on my own: the crawler that assembles the catalogue, the checker that probes every listing, and the writing. Before this I built SaveFromInternet and GrabReels, which meant living with other people’s APIs full time — parsers breaking when a platform shipped a change, rate limits arriving without warning, endpoints disappearing overnight. This directory exists because I got tired of free API lists that had never been checked.',
    credentials:
      'Independent developer. Founder and sole maintainer of SaveFromInternet (launched 2024) and GrabReels, both built on third-party APIs and maintained through their breaking changes. Everything published here is measured by the checker in this repository rather than repeated from another list, and the dates and figures in each article come from those runs.',
    website: 'https://savefrominternet.com',
    // github: 'https://github.com/<username>',
  },
];

/** Byline used when a post does not name an author. */
export const DEFAULT_AUTHOR = 'sandy';

export function getAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}

export function getAllAuthors(): Author[] {
  return authors;
}
