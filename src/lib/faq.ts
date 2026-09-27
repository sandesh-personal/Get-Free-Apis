import type { Faq } from '@/lib/blog';
import type { Api, Category } from '@/lib/apis';
import { getApi, getApisByCategory, stats } from '@/lib/apis';
import { site } from '@/lib/site';

/**
 * Contextual FAQs, generated from each page's own data.
 *
 * The point of these is that they answer what a visitor to *that* page is actually
 * asking. A generic "what is an API?" block repeated on 2,700 pages is thin content
 * and would put the whole site at risk; "does Open-Meteo need an API key?" answered
 * with our own measured check is a real answer that exists nowhere else.
 *
 * So every generator below reads live catalogue data. If the health check changes an
 * API's status, its FAQ answer changes with it at the next build.
 */

const n = (value: number) => value.toLocaleString('en-GB');

const AUTH_LABEL: Record<Api['auth'], string> = {
  none: 'no authentication at all',
  apiKey: 'an API key',
  oauth: 'OAuth',
  other: 'some form of authentication',
};

/**
 * FAQ for APIs with hand-verified access facts. These are the most-searched pages on
 * the site, and the questions follow the actual queries: "is it free", "api key",
 * "how to get a key", and whether it still exists at all.
 */
function verifiedApiFaq(api: Api, access: NonNullable<Api['access']>): Faq[] {
  const items: Faq[] = [];
  const verified = `Checked on ${access.verified}.`;

  if (api.status === 'discontinued') {
    const alternatives = (access.alternatives ?? [])
      .map((id) => getApi(id)?.name)
      .filter(Boolean)
      .join(', ');
    items.push({
      q: `Is the ${api.name} API still available?`,
      a: `No. ${access.summary}${alternatives ? ` Working alternatives: ${alternatives}.` : ''} ${verified}`,
    });
  }

  items.push({
    q: `Is the ${api.name} API free?`,
    a: `${access.summary}${access.paidFrom ? ` The cheapest paid plan: ${access.paidFrom}.` : ''} ${verified}`,
  });

  if (api.status !== 'discontinued') {
    const keyAnswer: Record<NonNullable<Api['access']>['key'], string> = {
      none: `No. ${api.name} answers requests with no key, token or sign-up.`,
      optional: `Not strictly. ${api.name} works without a key, but a free key gets you a dedicated rate limit.`,
      free: `Yes, and it is free: you get one by signing up.`,
      application: `Yes, and you have to apply for it rather than sign up instantly.`,
      paid: `Yes, and keys come only with a paid plan.`,
      closed: `Yes, but ${api.name} is not issuing new keys right now.`,
    };
    items.push({
      q: `Does ${api.name} need an API key?`,
      a: `${keyAnswer[access.key]}${access.keyUsage ? ` Send it as ${access.keyUsage}.` : ''}`,
    });
  }

  if (access.keySteps?.length && api.status !== 'discontinued') {
    items.push({
      q: `How do I get ${/^[aeiou]/i.test(api.name) ? 'an' : 'a'} ${api.name} API key?`,
      a: access.keySteps.map((step, i) => `${i + 1}. ${step}`).join(' '),
    });
  }

  if (access.freeLimits) {
    items.push({ q: `What are the ${api.name} API rate limits?`, a: access.freeLimits });
  }

  return items;
}

/** Questions a person lands on an API detail page wanting answered. */
export function apiFaq(api: Api): Faq[] {
  const health = api.health;
  const checked = health?.lastChecked ?? 'our last run';

  if (api.access) {
    const items = verifiedApiFaq(api, api.access);
    if (api.status !== 'discontinued') {
      items.push(corsFaq(api));
      const status = statusFaq(api);
      if (status) items.push(status);
    }
    return items;
  }

  const items: Faq[] = [];

  items.push({
    q: `Is ${api.name} free to use?`,
    a:
      api.auth === 'none'
        ? `${api.name} is listed in our free catalogue and required no credential when we called it. It needs ${AUTH_LABEL.none}, so you can send a request without signing up. Free tiers can still carry rate limits or non-commercial terms, so check the provider's own terms before shipping.`
        : `${api.name} is listed in our free catalogue, but it requires ${AUTH_LABEL[api.auth]}, so you will need to register before your first call. Providers frequently reserve higher limits and commercial use for paid plans.`,
  });

  items.push({
    q: `Does ${api.name} need an API key?`,
    a:
      api.auth === 'none'
        ? `No. We called ${api.name} on ${checked} with no key, no token and no Authorization header, and it responded. That is what puts it in our no-key collection.`
        : api.auth === 'apiKey'
          ? `Yes. ${api.name} authenticates with an API key. Keep it server-side rather than in browser code, because anything in your frontend bundle is readable by anyone who opens developer tools.`
          : api.auth === 'oauth'
            ? `${api.name} uses OAuth rather than a simple key, so you register an application and complete an authorisation flow before making calls. That is more setup than a key, and it is why OAuth APIs are harder to try quickly.`
            : `${api.name} requires some form of authentication. Check the provider's documentation for which scheme it expects.`,
  });

  items.push(corsFaq(api));
  const status = statusFaq(api);
  if (status) items.push(status);
  items.push(httpsFaq(api));

  return items;
}

function corsFaq(api: Api): Faq {
  return {
    q: `Can I call ${api.name} from browser JavaScript?`,
    a:
      api.cors === 'yes'
        ? `Yes. ${api.name} returned CORS headers when we checked it, so a browser will let your page read the response. You can fetch it directly from client-side JavaScript with no proxy and no backend.`
        : api.cors === 'no'
          ? `Not directly. ${api.name} did not return CORS headers when we checked, so the browser will block your page from reading the response even though the request itself succeeds. Call it from a server, or put a small proxy in front of it.`
          : `We could not confirm CORS support for ${api.name}. Test it from a browser before relying on it client-side; if the request succeeds in curl but fails in the console, CORS is the reason.`,
  };
}

function statusFaq(api: Api): Faq | null {
  const health = api.health;
  if (!health || api.status === 'discontinued') return null;
  const checked = health.lastChecked;
  return {
    q: `Is ${api.name} still working?`,
    a:
      api.status === 'live'
        ? `Yes, as of ${checked}. Our automated check reached ${api.name} and recorded a ${health.reliability}% reliability score with a median response time of ${health.latencyMs} ms. We re-check on a schedule, and this page updates with the result.`
        : `Not at our last check on ${checked}. ${api.name} did not respond successfully, which is why it is marked as down here. This may be temporary; we re-check on a schedule and the badge above reflects the most recent run.`,
  };
}

function httpsFaq(api: Api): Faq {
  return {
    q: `Is ${api.name} available over HTTPS?`,
    a: api.https
      ? `Yes. ${api.name} serves over HTTPS, so you can call it from a secure page without triggering a mixed-content block.`
      : `No. ${api.name} was only reachable over plain HTTP when we checked. Browsers block HTTP requests made from an HTTPS page, so this will fail in production unless you call it from a server instead.`,
  };
}

/** Questions that make sense on a category listing. */
export function categoryFaq(category: Category): Faq[] {
  const apis = getApisByCategory(category.slug);
  const noKey = apis.filter((a) => a.auth === 'none');
  const cors = apis.filter((a) => a.auth === 'none' && a.cors === 'yes');
  const live = apis.filter((a) => a.status === 'live');

  const fastest = [...live]
    .filter((a) => a.auth === 'none' && typeof a.health?.latencyMs === 'number')
    .sort((a, b) => (a.health!.latencyMs ?? 0) - (b.health!.latencyMs ?? 0))[0];

  const items: Faq[] = [
    {
      q: `How many free ${category.name.toLowerCase()} APIs are there?`,
      a: `We track ${n(apis.length)} in this category, of which ${n(live.length)} responded at our last check. ${n(noKey.length)} of them need no API key.`,
    },
    {
      q: `Which ${category.name.toLowerCase()} APIs work without an API key?`,
      a: `${n(noKey.length)} of the ${n(apis.length)} entries here need no credential. Filter this page by "no key" to see them, or browse the no-key collection for every keyless API across all categories.`,
    },
    {
      q: `Can I use these ${category.name.toLowerCase()} APIs in a browser app?`,
      a:
        cors.length > 0
          ? `${n(cors.length)} entries in this category need no key and return CORS headers, which is the combination that lets you call them straight from client-side JavaScript. The rest need a server or a proxy in between.`
          : `None of the entries in this category currently combine no-key access with CORS headers, so you will need a small server-side proxy to use them from browser JavaScript.`,
    },
  ];

  if (fastest?.health) {
    items.push({
      q: `Which is the fastest free ${category.name.toLowerCase()} API?`,
      a: `Of the keyless options that responded at our last check, ${fastest.name} was quickest at a median ${fastest.health.latencyMs} ms. Speed is only one factor — coverage and licensing usually matter more — but it is measured here rather than claimed.`,
    });
  }

  items.push({
    q: `How do you know these APIs still work?`,
    a: `We call every listing on a schedule and record the status code, response time and whether CORS headers came back. Those results drive the badges on this page. Across the whole catalogue, ${n(stats.down)} of ${n(stats.total)} entries were not responding at the last full run, which is the sort of thing an unchecked list never tells you.`,
  });

  return items;
}

/** Questions for a curated collection page. */
export function collectionFaq(collection: {
  slug: string;
  title: string;
  description: string;
}, count: number): Faq[] {
  const bySlug: Record<string, Faq[]> = {
    'no-api-key': [
      {
        q: 'What does "no API key required" actually mean?',
        a: `That we sent a request with no key, no token and no Authorization header, and the API responded. Every one of the ${n(count)} entries here passed that test on our last run. It does not mean unlimited — most still apply a rate limit by IP address.`,
      },
      {
        q: 'Are no-key APIs safe to use in production?',
        a: 'Some are, some are not. A national weather service with no key is as dependable as any paid product; a hobby project with no key may vanish. Judge it on who runs it and what their uptime looks like, not on whether a key is involved.',
      },
    ],
    'browser-ready': [
      {
        q: 'What makes an API "browser ready"?',
        a: `Three things together: no API key, CORS headers on the response, and HTTPS. ${n(count)} entries meet all three, which means you can fetch them from client-side JavaScript with no backend and no proxy.`,
      },
      {
        q: 'Why do some APIs fail in the browser but work in curl?',
        a: 'Because curl ignores CORS and browsers enforce it. The request succeeds in both cases; the browser simply refuses to hand the response to your JavaScript unless the API permits your origin.',
      },
    ],
    'for-beginners': [
      {
        q: 'What makes an API good for a beginner?',
        a: `No key to obtain, CORS so it works from a plain HTML page, a shallow JSON response you can read in full, and a live status. The ${n(count)} entries here meet all of those, so you can get a response on your first attempt.`,
      },
      {
        q: 'Do I need to install anything to try these?',
        a: 'No. Open any web page, press F12 for the console, and paste a fetch call. Every API in this collection sends CORS headers, which is precisely what makes that work.',
      },
    ],
    'free-for-developers': [
      {
        q: 'What counts as "free for developers" here?',
        a: `Tooling you use while building rather than data you build against: mock servers, test-data generators, OpenAPI directories, status monitors, converters and utilities. All ${n(count)} need no API key and responded at our last check.`,
      },
      {
        q: 'Are these free for commercial projects too?',
        a: 'Usually, but the API being keyless is not the same as the licence permitting commercial use. Each listing links to the provider’s own terms, and those are the authority on what you may do with it.',
      },
    ],
    fastest: [
      {
        q: 'How is response time measured?',
        a: 'We record the median time to a complete response from our own scheduled checks, not from provider marketing. The figure includes DNS, TLS and the server’s own processing, so it is what you would actually experience.',
      },
      {
        q: 'Does a fast API mean a good API?',
        a: 'No. Latency is easy to measure, which is exactly why it gets over-weighted. Coverage, licensing and whether the provider will still exist next year matter more for most projects.',
      },
    ],
  };

  return [
    ...(bySlug[collection.slug] ?? []),
    {
      q: 'How often is this list updated?',
      a: `The catalogue is re-checked on a schedule and this page is generated from the latest results, so entries move in and out as their status changes. ${n(count)} APIs match right now.`,
    },
  ];
}

/** The site-wide questions, used on /faq. */
export function siteFaq(): Faq[] {
  return [
    {
      q: `What is ${site.name}?`,
      a: `A directory of ${n(stats.total)} free and public APIs that we check ourselves rather than copying from someone else's list. Every entry records whether it needs a key, whether it supports CORS, whether it runs over HTTPS, and whether it actually responded when we last called it.`,
    },
    {
      q: 'Is it really free to use these APIs?',
      a: `Most do, and ${n(stats.noAuth)} need no key at all. "Free" still varies: some are free for any use, some only for non-commercial use, some only up to a request limit, and a few, such as OpenCorporates, are free only for approved public-benefit projects. For the most-searched APIs we check pricing and key terms by hand and say so on the page, including when an API has been shut down. For the rest, we link to the provider's own terms.`,
    },
    {
      q: 'How do you check that an API works?',
      a: `An automated job calls every listing on a schedule, trying HEAD first and falling back to GET, with a timeout and an identifying User-Agent. It records the status code, the response time and whether CORS headers came back. At the last full run, ${n(stats.down)} of ${n(stats.total)} entries were not responding.`,
    },
    {
      q: 'What does "no API key required" mean here?',
      a: 'That we sent a request with no key, no token and no Authorization header, and got a successful response. It is a tested claim, not a repeated one. It does not mean unlimited use — most keyless APIs still rate-limit by IP address.',
    },
    {
      q: 'What does CORS mean, and why do you show it?',
      a: 'CORS decides whether browser JavaScript on your site is allowed to read a response from another domain. Without it, a request that works perfectly in curl will fail in a web page. It is the single most common reason a free API turns out to be unusable for a frontend project, which is why we test for it.',
    },
    {
      q: 'An API listed here is down or has changed. What now?',
      a: 'Our status badges come from scheduled checks, so a change usually appears within a day. If something is wrong before we catch it, tell us through the contact page and we will correct the entry.',
    },
    {
      q: 'Can I submit an API to the directory?',
      a: 'Yes. Use the submit page. We check anything submitted the same way we check everything else, so a listing only appears once it has actually responded to us.',
    },
    {
      q: 'Where does the catalogue data come from?',
      a: 'Entries are aggregated from public sources including public-apis, public-api-lists and freepublicapis, then normalised and independently verified by our own checks. The health, latency and CORS data is entirely our own.',
    },
    {
      q: 'Do you make money from this site?',
      a: 'The site carries advertising to cover hosting and the cost of running the checks. Ads never influence which APIs are listed, how they are ranked, or what the status badges say, and our editorial policy sets out where that line sits.',
    },
    {
      q: 'Can I use your data in my own project?',
      a: 'The listings are aggregated from public sources under their own licences. Our measurements — status, latency, reliability and CORS results — are ours, and you are welcome to cite them with a link back. Get in touch if you want something more systematic.',
    },
  ];
}
