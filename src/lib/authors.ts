/**
 * Authors.
 *
 * Google's helpful-content guidance singles out authorship: readers should be able to
 * see who wrote something and why they are worth listening to. A missing or generic
 * byline is one of the most common reasons an ad network rejects a site.
 *
 * Replace the placeholder below with a real person before launch. Do not invent one.
 * The credentials line has to be something a sceptical reader could verify.
 */

export type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  credentials: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  /** Set false once the details are real, so the build stops warning. */
  placeholder?: boolean;
};

export const authors: Author[] = [
  {
    slug: 'editorial',
    name: 'The GetFreeAPIs team',
    role: 'Editorial',
    bio: 'We build and maintain the catalogue behind this site, probing every listed API on a daily schedule and publishing what we find. Articles here are grounded in those measurements rather than in secondhand summaries.',
    credentials:
      'REPLACE THIS. Name the person writing, what they have built, and why they can be trusted on APIs. Link a GitHub profile and one other verifiable profile.',
    github: 'https://github.com/getfreeapis',
    placeholder: true,
  },
];

export function getAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}

export function getAllAuthors(): Author[] {
  return authors;
}
