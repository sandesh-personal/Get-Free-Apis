import type { RawEntry } from './types';

/**
 * Hand-added entries that don't come from any scraped upstream list.
 *
 * sources.ts scrapes three community-maintained lists; none of them carry official
 * government or institutional APIs like this one, so build-data.ts has no way to
 * discover them on its own. Add an entry here only once you've personally verified
 * the URL, auth requirement and CORS support — don't guess CORS, test it with a real
 * request and an Origin header. That measurement is exactly the thing this site
 * exists to get right where upstream lists just guess.
 */
export const CUSTOM_ENTRIES: RawEntry[] = [
  {
    name: 'ClinicalTrials.gov',
    description:
      'Search and retrieve data on clinical trials registered worldwide: conditions, interventions, sponsors, locations and results.',
    category: 'Pharma',
    url: 'https://clinicaltrials.gov/api/v2/studies',
    auth: 'none',
    https: true,
    cors: 'yes',
    source: 'custom',
  },
];
