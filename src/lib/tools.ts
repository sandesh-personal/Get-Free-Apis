/**
 * The tools catalogue.
 *
 * One source of truth for the index page, the nav, the sitemap and each tool's own
 * metadata, so a new tool cannot end up listed in one place and missing from another.
 *
 * Every tool here runs entirely in the visitor's browser. That is a deliberate
 * constraint, not an accident of the current hosting: nothing is proxied, so there
 * are no API keys to hold, no per-request cost as traffic grows, no rate limit to
 * police, and no user input touching a server we would then have to make promises
 * about. It also keeps the site a static export.
 */
export type Tool = {
  slug: string;
  name: string;
  /** Sentence used on the index card. */
  blurb: string;
  /** <title> and meta description for the tool's own page. */
  title: string;
  description: string;
  /** Shown under the tool's h1. */
  intro: string;
  /** Rendered as a keyword line on the page; also the honest "what it does" list. */
  highlights: string[];
};

export const tools: Tool[] = [
  {
    slug: 'curl-converter',
    name: 'cURL converter',
    blurb:
      'Paste a cURL command and get the equivalent JavaScript fetch, axios, or Python requests code.',
    title: 'cURL to fetch, axios & Python Converter',
    description:
      'Convert a cURL command into JavaScript fetch, axios or Python requests code. Handles headers, methods, JSON bodies and basic auth. Runs entirely in your browser.',
    intro:
      'Paste a cURL command — the kind you copy out of API documentation or your browser devtools — and get working code in the language you actually write.',
    highlights: [
      'Methods, headers, query strings and request bodies',
      'JavaScript fetch, axios and Python requests',
      'Basic auth converted to the right header',
      'Nothing is uploaded — the parsing happens on this page',
    ],
  },
  {
    slug: 'json-formatter',
    name: 'JSON formatter',
    blurb:
      'Format, validate and explore JSON. Get the exact line and column when it will not parse.',
    title: 'JSON Formatter, Validator & Viewer',
    description:
      'Format messy JSON, validate it with the exact error position, minify it, or explore it as a collapsible tree. Free, no sign-up, and runs entirely in your browser.',
    intro:
      'Paste JSON to pretty-print it, minify it, or read it as a tree. If it will not parse, you get the line and column of the problem rather than just "unexpected token".',
    highlights: [
      'Pretty-print with your choice of indent',
      'Validation with the exact line and column',
      'Collapsible tree view for large responses',
      'Nothing is uploaded — the parsing happens on this page',
    ],
  },
  {
    slug: 'cors-checker',
    name: 'CORS checker',
    blurb:
      'Test whether an API can be called straight from browser JavaScript, or whether it needs a proxy.',
    title: 'CORS Checker — Test If An API Works In The Browser',
    description:
      'Check whether an API endpoint allows cross-origin browser requests. Runs a real fetch from your browser and reports whether CORS blocked it, so you know if you need a proxy.',
    intro:
      'The question this answers is the one that decides your architecture: can I call this endpoint from front-end JavaScript, or do I need a backend in the way?',
    highlights: [
      'Runs a real cross-origin request from your browser',
      'Tells CORS rejection apart from the endpoint simply being down',
      'Reports status, timing and the headers the browser will let it read',
      'Nothing is uploaded — the request goes straight from you to the endpoint',
    ],
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT decoder',
    blurb:
      'Decode a JSON Web Token to read its header and claims, and see whether it has expired.',
    title: 'JWT Decoder — Read Token Header, Payload & Expiry',
    description:
      'Decode a JSON Web Token to inspect its header and payload, with expiry and issued-at timestamps converted to readable dates. Runs entirely in your browser — no token is ever sent anywhere.',
    intro:
      'Decode a token to see what is actually inside it. Timestamps are converted to readable dates, and the expiry is checked against your clock.',
    highlights: [
      'Header and payload decoded from base64url',
      'exp, iat and nbf shown as dates, with expiry state',
      'Signature is shown but not verified — that needs the secret',
      'Nothing is uploaded — your token never leaves this page',
    ],
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
