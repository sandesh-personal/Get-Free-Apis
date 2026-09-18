# Free APIs Directory — Final Build Roadmap

Planning document. Written 2026-09-18, revised to cover E-E-A-T, AdSense and the content programme.
Read this before writing code.

Domain: **getfreeapis.com**

---

## Build status (2026-09-18)

| Phase | State | Notes |
| --- | --- | --- |
| 0 — Data foundation | **Done** | 2,712 unique APIs across 56 categories, committed to `data/` |
| 1 — Core site | **Done** | Home, browse with filters, categories, collections, dark mode |
| 2 — Detail pages and SEO | **Done** | 2,712 detail pages, JSON-LD, sitemap with 2,784 URLs |
| 3 — Trust layer | **Done** | All 2,712 probed. 487 dead. CORS unknowns cut from 1,661 to 114 |
| 4 — Blog infrastructure | Not started | MDX pipeline, authors, article schema |
| 5 — Content and compliance | Legal pages scaffolded | 50 posts still to write. Placeholders marked in yellow need real details |
| 6 — Growth | Not started | Public JSON API, playground, compare view |

Measured on the first full run, not estimated:

| Metric | Value |
| --- | --- |
| Unique APIs | 2,712 |
| Responding | 2,225 |
| Failing | 487 |
| Healthy share | 82% |
| Need no API key | 1,051 |
| CORS confirmed by our own probes | 717 |
| CORS still unknown | 114 |

---

## Contents

1. [What we are building](#1-what-we-are-building)
2. [Research findings](#2-research-findings-verified-2026-09-18)
3. [Competitive landscape](#3-competitive-landscape)
4. [Architecture decision](#4-architecture-decision)
5. [Tech stack](#5-tech-stack)
6. [Data model](#6-data-model)
7. [Site map](#7-site-map)
8. [E-E-A-T and AdSense compliance](#8-e-e-a-t-and-adsense-compliance)
9. [Content programme — 50 posts](#9-content-programme--50-posts)
10. [Image strategy and Unsplash compliance](#10-image-strategy-and-unsplash-compliance)
11. [Phased delivery](#11-phased-delivery)
12. [Risks](#12-risks)
13. [Decisions to confirm](#13-decisions-to-confirm)

---

## 1. What we are building

A fast, searchable, SEO-indexed directory of free public APIs, with a substantial problem-solving blog
attached. Visual design follows [Free-APIs.github.io](https://github.com/Free-APIs/Free-APIs.github.io),
meaning React and Tailwind, a card grid, and colour-coded Auth/HTTPS/CORS badges. Architecture deliberately
does **not** follow it, for reasons in §2.1.

Target user: a developer or student who wants "a free weather API that needs no key and works from the
browser" and wants it in under thirty seconds. Then, when they hit a CORS error twenty minutes later, they
come back to our blog to fix it.

Revenue model: AdSense, which means the whole build is constrained by §8. Read that section before writing
a single blog post.

---

## 2. Research findings (verified 2026-09-18)

### 2.1 The reference site is currently broken

`Free-APIs.github.io` fetches its entire dataset at runtime from `https://api.publicapis.org/entries`.
That host no longer resolves:

```
https://api.publicapis.org/entries   ->  HTTP 000 (connection failure)
https://api.publicapis.dev/entries   ->  HTTP 404
```

The repo contains **no local data file** — the tree is only React components, pages and config. So with the
upstream API gone, the site has nothing to render. This dictates our architecture: **never fetch the
catalogue at runtime from a third party.**

### 2.2 What the reference repo actually is

| Aspect | Detail |
| --- | --- |
| Stack | React (Create React App) + CRACO + Tailwind CSS |
| Stars / forks | 1.3k / 147 |
| Routes | `/`, `/about`, `/browse`, `/categories`, `/categories/:category`, `/help`, `*` |
| Components | `Nav`, `Jumbotron`, `ListDisplay` (+`Card`, `OptionsRow`), `Button`, `Footer`, `Help`, `Subtitle`, `ScrollToTop`, `ScrollUp`, `Tracking` |
| Card design | `w-72`, `rounded-lg bg-gray-200 p-4 m-3 shadow-lg`, `hover:shadow-xl hover:bg-gray-100` |
| Card content | Title, italic description, three colour-coded status badges |
| Badge colours | green = no auth / CORS yes / HTTPS yes, blue = apiKey, purple = OAuth, red = no, yellow = unknown |
| Controls | Search box, category select, shuffle, reset, results counter |

Worth keeping: the card grid, three-badge scannability, the "browse all vs browse by category" split, and
the shuffle button.

Worth fixing: no per-API detail pages, no dark mode, client-side rendering only, no filtering by
auth/CORS/HTTPS, and cards that link straight off-site so the visitor never returns. That last point is fatal
for an ad-supported model — a bounce-and-leave site earns nothing.

### 2.3 `hiteshchoudhary/apihub` is a different kind of project

FreeAPI.app is **not** a directory. It is a Node.js + MongoDB + Docker backend that *serves* mock data for
developers to practise against. Its hosted instance resets every two hours. Not a competitor, not a data
source. Useful later as a pattern if we host our own practice endpoints (Phase 6).

### 2.4 Verified data sources

Every row below was fetched and parsed today. Counts are real, not from documentation.

| Source | Entries | Format | Notes |
| --- | --- | --- | --- |
| `public-apis/public-apis` README | **1,839** in 52 categories | Markdown tables | The canonical list. Largest. Messy. |
| `public-api-lists/public-api-lists` README | **837** in 51 categories | Markdown tables | Actively maintained fork, cleaner |
| `freepublicapis.com/api/apis?limit=1000` | **654** | JSON | **Has health metrics.** Caps at 654. |
| `api.apis.guru/v2/list.json` | **2,529** providers | JSON, 8.8 MB | OpenAPI specs, enterprise-skewed |
| `api.publicapis.org/entries` | — | — | **DEAD. Do not use.** |

The freepublicapis payload carries trust signals nobody else has:

```json
{
  "id": 1264,
  "emoji": "📊",
  "title": "2026 Tax Figures API",
  "description": "...",
  "documentation": "https://planomy.net/data/",
  "methods": 1,
  "health": 95,
  "popularity": 0,
  "avg_reliability": 100,
  "avg_error": 0,
  "avg_latency": 219,
  "source": "https://freepublicapis.com/2026-tax-figures-api"
}
```

### 2.5 Parsing hazards, found by running the parser

- **The first `### ` section of the public-apis README is a sponsored APILayer table** with a different
  column layout. It pollutes results badly unless skipped by name.
- **Auth values are not normalised**: `No` (868), `` `apiKey` `` (802), `` `OAuth` `` (150),
  `` `X-Mashape-Key` `` (6), `` `No` `` (3), `apiKey` (3). Strip backticks, lowercase, map to an enum.
- **CORS is mostly unknown**: `Unknown` (1,003), `Yes` (651), `No` (178).
- Rows have inconsistent trailing pipes and stray blank lines inside tables.
- Many URLs carry `utm_source=Github` tracking params that must be stripped before dedupe.

**Headline number:** 868 of 1,839 entries need no authentication at all.

---

## 3. Competitive landscape

Free directories, our actual competitors:

| Site | Scale | Angle |
| --- | --- | --- |
| [publicapis.io](https://publicapis.io/) | 1,500+ | Largest polished free directory. **Also runs a blog** — see note below |
| [public-apis.io](https://public-apis.io/) | 1,000+ | REST-focused, category landing pages |
| [apilist.fun](https://apilist.fun/) | 800+ | Quirky and novelty APIs |
| [freepublicapis.com](https://www.freepublicapis.com/) | 654 | **Tests every API daily** — the trust play |
| [apis.guru](https://apis.guru/) | 2,529 | "Wikipedia for REST APIs", OpenAPI specs |
| [any-api.com](https://any-api.com/) | 1,400+ | Docs plus in-browser test console |
| [publicapi.dev](https://publicapi.dev/) | — | Clean categorised browse |
| [apislist.com](https://apislist.com/) | — | Community contributions |
| [APIContext](https://apicontext.com/api-directory/) | — | Performance benchmarks |
| [API3 Alliance](https://api3.org/web3-apis/) | — | Web3 only |
| [Postman API Network](https://www.postman.com/api-network/) | — | Runnable collections |

Commercial marketplaces, a different market: [RapidAPI](https://rapidapi.com/) at 35,000+ APIs and Nokia-owned
since November 2024, [APILayer](https://apilayer.com/), [ApyHub](https://apyhub.com/), Zyla, AWS Marketplace,
Kong Konnect.

**Competitor content benchmark.** publicapis.io already ranks with posts like "Free Weather API No Key
Required — Top 12 APIs for 2026". That post runs roughly 2,000–2,500 words with a quick-reference comparison
table, per-API sections with code snippets, a "choosing the right one" section and an FAQ block. That is the
format to match or beat. Anything shorter will not compete.

### The gap we exploit

Almost every free directory is a **link graveyard**: a scraped copy of the same README where a large share of
entries 404 and nobody checks. Only freepublicapis tests regularly, and it covers 654 APIs.

The wedge is **trust plus depth**, not size:

1. **Verified liveness on every entry.** Health-check all 1,800+ and show "last checked" openly, including
   failures. Honesty about dead links is the differentiator, and it is also exactly the "Trustworthiness" leg
   of E-E-A-T.
2. **A real page per API**, not a card that bounces the visitor off-site.
3. **Filters matching real intent**: no-key-required, CORS-enabled, HTTPS-only.
4. **Fill in the 1,003 unknown CORS values ourselves** by probing. Original data no competitor has, and
   original research is exactly what Google's helpful-content guidance rewards.

---

## 4. Architecture decision

**Build-time ETL into static JSON. No runtime third-party fetches. Ever.**

```
GitHub Actions (scheduled, weekly)
   |
   |-- fetch public-apis README        (1,839 raw)
   |-- fetch public-api-lists README   (837 raw)
   |-- fetch freepublicapis JSON       (654 + health metrics)
   |
   v
 normalise -> dedupe by canonical URL -> merge health data -> enrich
   |
   v
 /data/apis.json  +  /data/categories.json   (committed to the repo)
   |
   v
 Next.js static build -> CDN
```

Why:

- **It cannot break the way the reference site broke.** If every upstream disappears, the committed JSON
  still builds and still serves.
- Data lives in git, so every refresh is a reviewable diff.
- Static pages mean no server, no database, near-zero hosting cost, excellent Core Web Vitals. Page speed is
  an AdSense revenue multiplier, not just an SEO nicety.
- Pre-rendered HTML makes the ~2,000 detail pages indexable.

Dedupe key: documentation URL, lowercased, with protocol, `www.`, trailing slash and `utm_*` stripped. Expect
real overlap between sources — the merged catalogue should land near 2,000–2,300 unique entries, not the
3,330 raw sum.

---

## 5. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15, App Router** | Static export keeps the React+Tailwind feel while pre-rendering every page for SEO. CRA cannot do this. |
| Language | **TypeScript** | 2,000 rows with a dozen fields needs a compiler-enforced schema. |
| Styling | **Tailwind CSS** | Same as the reference design. |
| Components | **shadcn/ui** | Accessible primitives for command palette, dialogs, selects. |
| Blog | **MDX** via `next-mdx-remote` or Contentlayer | Lets posts embed live React components — runnable examples, comparison tables, callouts. That interactivity is a genuine E-E-A-T signal. |
| Search | **FlexSearch**, client-side | ~2,000 rows. Ships in the bundle, instant, free. |
| ETL | **Node scripts in `/scripts`** | Same language as the app. |
| Automation | **GitHub Actions** | Weekly catalogue refresh, daily health checks. |
| Hosting | **Vercel or Cloudflare Pages** | Free at this scale. Static export also deploys to GitHub Pages. |
| Analytics | **Plausible or Umami** | Privacy-friendly. Note: AdSense itself requires a cookie/consent notice regardless. |
| Images | **`next/image`** with self-hosted AVIF/WebP | See §10. |

Astro is a reasonable alternative with the same static-first benefits. Next.js is recommended because the
filter and search surface is substantial and the MDX blog integration is better supported.

---

## 6. Data model

```ts
type Api = {
  id: string;              // stable slug, e.g. "cat-facts"
  name: string;
  description: string;
  category: string;        // normalised enum
  url: string;             // canonical documentation URL
  auth: 'none' | 'apiKey' | 'oauth' | 'other';
  https: boolean;
  cors: 'yes' | 'no' | 'unknown';
  sources: string[];       // which upstream lists contained it
  emoji?: string;
  health?: {
    score: number;         // 0-100
    reliability: number;
    latencyMs: number;
    lastChecked: string;   // ISO date
  };
  status: 'live' | 'down' | 'unchecked';
};

type Post = {
  slug: string;
  title: string;
  description: string;      // meta description, 150-160 chars
  cluster: 'errors' | 'fundamentals' | 'roundups' | 'howto';
  author: string;           // must map to an Author with real credentials
  publishedAt: string;
  updatedAt: string;        // shown on-page; freshness is an E-E-A-T signal
  readingTime: number;
  heroImage: Image;
  relatedApis: string[];    // slugs -> internal links into the directory
  relatedPosts: string[];
  faq?: { q: string; a: string }[];  // powers FAQPage JSON-LD
  sources?: { label: string; url: string }[];  // outbound citations
};

type Author = {
  slug: string;
  name: string;
  bio: string;
  credentials: string;      // concrete, verifiable
  avatar: string;
  github?: string;
  linkedin?: string;
  x?: string;
};
```

`categories.json` holds slug, display name, description, icon and entry count.

---

## 7. Site map

```
/                            Hero, search, category tiles, featured + recently verified
/browse                      All APIs, filter rail, client-side search
/categories                  Category grid with counts
/categories/[slug]           One category                        <- ~52 SEO pages
/api/[slug]                  Single API detail page              <- ~2,000 SEO pages
/collections/[slug]          Curated sets, e.g. "APIs with no key"
/status                      Health dashboard, recently-died list
/blog                        Post index, filter by cluster       <- 50 SEO pages
/blog/[slug]                 Individual post
/blog/category/[cluster]     Cluster hub pages                   <- 4 pillar pages
/authors/[slug]              Author bio pages                    <- E-E-A-T requirement
/submit                      Submission form
/about                       Who we are, how we verify, methodology
/contact                     Real contact route
/privacy                     Privacy policy                      <- AdSense requirement
/terms                       Terms of use                        <- AdSense requirement
/disclaimer                  Affiliate/ads disclosure            <- AdSense requirement
/editorial-policy            How we research, test and update    <- E-E-A-T requirement
/help
```

Roughly 2,100 pre-rendered pages. The `/api/` and `/blog/` trees are the organic traffic engine.

---

## 8. E-E-A-T and AdSense compliance

This section is a hard constraint on everything else. Sourced from Google's own documentation, not from
SEO blogs.

### 8.1 What Google officially requires for AdSense

From [AdSense eligibility](https://support.google.com/adsense/answer/9724), four things:

1. Content must be **high-quality, original, and attract an audience**
2. You must have **access to the HTML source** of the site
3. You must be **18 or older**
4. The site must **comply with AdSense Program policies**

The overwhelmingly common rejection reason is **"Low value content."** Everything below exists to avoid it.

### 8.2 What E-E-A-T actually means here

From Google's [helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
Note that **Trust is the most important of the four**, and content does not have to demonstrate all of them.

| Leg | What it means | How we demonstrate it |
| --- | --- | --- |
| **Experience** | First-hand use of the thing | Every API we write about, we actually call. Screenshot the real response. Record the real latency. Say "we tested this on 2026-09-18 and got a 502." |
| **Expertise** | Subject knowledge | Real author bios with real credentials. Technically precise writing. Correct terminology. |
| **Authoritativeness** | Recognised as a source | Our own health dataset — nobody else has 2,000 APIs probed daily. Publish it, let people cite it. |
| **Trustworthiness** | Accurate, honest, contactable | Public methodology, visible last-updated dates, outbound citations, real contact page, honest "this API is dead" labels. |

Google's self-assessment questions we must be able to answer yes to:

- Does it provide **original information, research, or analysis**? → Yes: our health and CORS dataset.
- Is it **substantially more comprehensive** than other sources? → Yes: 2,000+ verified vs 654 tested elsewhere.
- Does it demonstrate **first-hand knowledge**? → Yes: we call every API we write about.
- Would someone **bookmark or recommend** it? → That is the bar for every post.
- Was it made **primarily for search engines**? → Must be no. This is what kills thin roundup sites.

### 8.3 Non-negotiable checklist before applying to AdSense

**Content**
- [ ] All 50 posts published, each **1,500–2,500 words** of genuinely original writing
- [ ] Zero thin pages. If a post cannot justify 1,500 words, cut it rather than pad it
- [ ] Every post has a byline linking to a real author page
- [ ] Every post shows published and last-updated dates
- [ ] Every factual claim about an API is one we verified, with the test date stated
- [ ] Outbound citations to primary sources (official docs, RFCs, MDN)

**Required pages**
- [ ] Privacy policy covering cookies, AdSense, and analytics
- [ ] Terms of use
- [ ] Disclaimer covering ads and any affiliate links
- [ ] About page naming real people and explaining the methodology
- [ ] Contact page with a working route, not just a mailto
- [ ] Editorial policy explaining how we research, test and correct

**Technical**
- [ ] HTTPS everywhere, enforced
- [ ] Custom domain, not a subdomain of a free host
- [ ] Clear header nav and footer nav
- [ ] Mobile responsive down to 360px
- [ ] `sitemap.xml` submitted, `robots.txt` correct
- [ ] Core Web Vitals green
- [ ] `ads.txt` at the root once AdSense issues the publisher ID
- [ ] Cookie consent banner, required for EEA/UK traffic
- [ ] No broken internal links, no empty category pages

**Timing**
- [ ] Site live for **at least 4–6 weeks** with organic traffic before applying
- [ ] Some real traffic arriving. A zero-traffic site reads as a made-for-ads site

### 8.4 Ad placement, once approved

Do not let ads damage the thing that earns the traffic.

- No ads above the fold on the homepage
- Maximum three ad units per article, placed between sections rather than mid-sentence
- No ads on `/browse` filter results — it is a tool, ads break the interaction
- Never place ads adjacent to the health status badges. Ambiguity there destroys the trust play
- Respect Core Web Vitals: reserve ad slot height to avoid layout shift

### 8.5 The AI-content risk

Google does not penalise AI assistance. It penalises unhelpful, unoriginal content regardless of origin. The
protection is that our posts contain things a generator cannot invent: real response payloads we captured,
real latency numbers from our health checks, real dates, real screenshots. **Every post must contain at least
one piece of data that exists nowhere else.** That single rule is the difference between approval and a
"low value content" rejection.

---

## 9. Content programme — 50 posts

Four clusters. Each cluster gets a pillar page at `/blog/category/[cluster]`, and every post links up to its
pillar, sideways to two or three siblings, and down into relevant `/api/[slug]` pages. That internal linking
is what makes the directory and the blog reinforce each other.

Search-demand evidence for these topics: 429 rate-limit errors are documented as the single most common API
error developers hit; 401 versus 403 auth confusion is next; and "free X API no key" roundups are what
competitors already rank for.

### Cluster A — Errors and debugging (10 posts)

Highest problem-solving intent. Someone searching these has a broken build right now.

| # | Post | Primary query |
| --- | --- | --- |
| 1 | How to fix CORS errors when calling a public API from the browser | "api cors error fix" |
| 2 | HTTP 429 Too Many Requests: exponential backoff with jitter, done right | "429 too many requests fix" |
| 3 | 401 vs 403: diagnosing API authentication failures | "401 vs 403 api" |
| 4 | Why your API key suddenly stopped working | "api key not working" |
| 5 | "Failed to fetch" in JavaScript: the seven real causes | "failed to fetch javascript" |
| 6 | Mixed content errors: calling an HTTP API from an HTTPS page | "mixed content api" |
| 7 | When an API returns HTML instead of JSON | "unexpected token < in json" |
| 8 | Preflight OPTIONS requests explained, with real traces | "preflight request cors" |
| 9 | Handling API timeouts and retries without making things worse | "api timeout retry" |
| 10 | Reading a 500 from someone else's API: what you can and cannot do | "api 500 error" |

### Cluster B — Fundamentals (8 posts)

| # | Post | Primary query |
| --- | --- | --- |
| 11 | Your first API call, compared: curl, fetch, and Python requests | "how to call an api" |
| 12 | REST vs GraphQL vs gRPC vs SOAP: picking one in 2026 | "rest vs graphql" |
| 13 | HTTP status codes that actually matter when consuming APIs | "http status codes list" |
| 14 | How to read API documentation without getting lost | "how to read api docs" |
| 15 | API authentication explained: API key, OAuth 2.0, JWT, Basic | "api authentication types" |
| 16 | Endpoints, resources and base URLs | "what is an api endpoint" |
| 17 | Query params vs path params vs request body | "query params vs path params" |
| 18 | API pagination patterns: offset, cursor, and page tokens | "api pagination" |

### Cluster C — "Best free API for X" roundups (22 posts)

Highest volume, strongest commercial intent, best AdSense earners. Each one is backed by our own health
data, which is what makes it beat competitors. Format follows the benchmark in §3: comparison table, per-API
section with a working snippet, selection guidance, FAQ.

| # | Post |
| --- | --- |
| 19 | Best free weather APIs with no key required |
| 20 | Best free APIs for beginners to learn with |
| 21 | Free currency exchange rate APIs |
| 22 | Free country, flag and geography APIs |
| 23 | Free image and photo APIs |
| 24 | Free AI and LLM APIs with genuine free tiers |
| 25 | Free news and headline APIs |
| 26 | Free stock market and finance APIs |
| 27 | Free sports and live-score APIs |
| 28 | Free movie and TV APIs |
| 29 | Free music and lyrics APIs |
| 30 | Free cryptocurrency APIs |
| 31 | Free recipe and nutrition APIs |
| 32 | Free government and open-data APIs |
| 33 | Free geocoding and maps APIs |
| 34 | Free IP geolocation APIs |
| 35 | Free email validation APIs |
| 36 | Free QR code and barcode APIs |
| 37 | Free mock and test-data APIs |
| 38 | Free anime and manga APIs |
| 39 | Free space and astronomy APIs |
| 40 | Free jokes, quotes and trivia APIs |

### Cluster D — Practical how-to (10 posts)

| # | Post | Primary query |
| --- | --- | --- |
| 41 | Build a weather dashboard with a free no-key API | "weather app api tutorial" |
| 42 | How to keep API keys out of your frontend bundle | "hide api key frontend" |
| 43 | Caching API responses to stay inside a free tier | "cache api responses" |
| 44 | Testing APIs with Postman, curl and HTTPie | "how to test an api" |
| 45 | Building a CORS proxy the legitimate way | "cors proxy" |
| 46 | How to check whether an API is still alive | "is this api still working" |
| 47 | Client-side rate limiting: queues, tokens and backoff | "rate limit requests javascript" |
| 48 | Surviving breaking API changes and versioning | "api versioning" |
| 49 | Mocking APIs during development | "mock api for development" |
| 50 | When a free tier stops being enough | "free api limits" |

### Per-post quality template

Every post ships with all of these or it does not ship:

1. Problem stated in the first 100 words, concretely
2. TL;DR answer box immediately after, for featured-snippet capture
3. Original hero image (§10)
4. At least one **original diagram or annotated screenshot**
5. Working code in at least two languages, copy-buttoned
6. **Real captured output** — an actual response body or error, with the date we captured it
7. Comparison table where the topic allows
8. Internal links: 1 to the cluster pillar, 2–3 to sibling posts, 3–5 into `/api/[slug]`
9. FAQ block of 3–5 questions, emitted as `FAQPage` JSON-LD
10. Author byline, published and updated dates
11. Outbound citations to primary sources
12. 1,500–2,500 words

### Publishing cadence

Do not dump 50 posts in one day. A site going from zero to 50 posts overnight looks automated and is a
common rejection trigger.

| Weeks | Posts | Focus |
| --- | --- | --- |
| 1–2 | 10 | Cluster A in full. Highest intent, establishes the voice |
| 3–4 | 8 | Cluster B. Builds the fundamentals pillar |
| 5–8 | 22 | Cluster C, roughly 5–6 per week |
| 9–10 | 10 | Cluster D |
| 11–12 | 0 | Polish, internal linking pass, fix anything Search Console flags |
| 13 | — | Apply to AdSense |

---

## 10. Image strategy and Unsplash compliance

### 10.1 The Unsplash problem, and how to avoid it

There are **two different Unsplash legal regimes**, and the plan to use an API key to download 50 images
falls on the wrong side of the line.

| | [Unsplash License](https://unsplash.com/license) (download from the website) | [API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) (using an API key) |
| --- | --- | --- |
| Self-hosting | **Allowed.** License explicitly grants download and copy | **Not allowed.** "All API uses must use the hotlinked image URLs returned by the API under the `photo.urls` properties" |
| Attribution | Not required, appreciated | **Required**: photographer, Unsplash, and a profile link with `?utm_source=your_app_name&utm_medium=referral` |
| Download endpoint | N/A | **Mandatory** ping to `photo.links.download_location` on each use |
| Rate limit | N/A | 50/hour demo, 1,000/hour after production approval |
| Commercial use | Allowed | Allowed, but cannot resell unaltered photos |

So using the API key to download and self-host would breach the API Guidelines, while doing exactly the same
thing by hand from the website is explicitly permitted by the License.

**Recommendation: do not use the API key for the hero images.** Download the 50 images directly from
unsplash.com under the Unsplash License and self-host them. This is compliant, avoids the hotlinking
requirement entirely, and is also the better engineering choice — hotlinking would add a third-party runtime
dependency, which is precisely the failure mode that killed the reference site in §2.1. It would also hurt
the Core Web Vitals that AdSense revenue depends on.

Attribute the photographers anyway, in a small caption or an `/image-credits` page. Not required, but it is
a cheap Trustworthiness signal and it is the decent thing to do.

If you would rather use the API, that is workable, but then we must hotlink every image, ship attribution
with utm parameters on each one, and fire the download endpoint. Say so and I will build it that way.

Both regimes forbid one thing that is worth noting: "compiling images from Unsplash to replicate a similar or
competing service." We are not doing that, so we are clear.

### 10.2 Why stock photos alone will not satisfy E-E-A-T

A post about fixing CORS errors illustrated with a photo of a laptop on a desk adds nothing. Google's
helpful-content guidance explicitly asks whether content provides original information — generic stock
imagery is evidence against that, and heavy reliance on it is associated with the "low value content"
rejection.

So the 50 Unsplash images are for **hero and Open Graph slots only**, where they do real work making the site
look credible in search results and social shares. The images that carry E-E-A-T weight are the ones we make
ourselves.

### 10.3 The image plan

Total well above the 50 minimum, in three tiers:

| Tier | Count | Source | Purpose |
| --- | --- | --- | --- |
| **Hero images** | 50 | Unsplash, one per post | Post header and OG card |
| **Original diagrams** | ~40 | We author them | CORS preflight flow, OAuth handshake, backoff timing, pagination patterns. These are the E-E-A-T workhorses |
| **Annotated screenshots** | ~60 | We capture them | Real DevTools network panels, real error messages, real Postman runs, real terminal output |
| **Auto-generated OG cards** | ~2,100 | `next/og` at build time | One per API detail page, no manual work |

Diagrams should be authored as SVG so they stay sharp, stay small, and can be restyled for dark mode. Consider
Excalidraw or Mermaid for speed.

### 10.4 Image pipeline

- [ ] `scripts/fetch-unsplash.ts` — given 50 search terms, download, then record photographer name, profile
      URL and photo ID into `data/image-credits.json`
- [ ] Convert to AVIF with WebP fallback, generate 3 widths each
- [ ] Serve through `next/image` with explicit width and height to prevent layout shift
- [ ] Lazy-load everything below the fold, eager-load the hero only
- [ ] Descriptive alt text on every image, written for a screen reader rather than for keywords
- [ ] Keep hero images under 150 KB after conversion
- [ ] Build `/image-credits` from `image-credits.json`

---

## 11. Phased delivery

### Phase 0 — Data foundation

The site is worthless without clean data, so this comes before any UI.

- [ ] `create-next-app` with TypeScript and Tailwind; init git
- [ ] `scripts/fetch-public-apis.ts` — parse README markdown, **skip the APILayer promo section**
- [ ] `scripts/fetch-public-api-lists.ts`
- [ ] `scripts/fetch-freepublicapis.ts` — JSON with health metrics
- [ ] `scripts/normalise.ts` — auth enum, backtick stripping, URL canonicalisation, utm removal
- [ ] `scripts/merge.ts` — dedupe by canonical URL, merge health, assign slugs
- [ ] Emit and commit `data/apis.json` and `data/categories.json`
- [ ] Zod validation in CI so a malformed upstream cannot poison a build

**Done when:** `npm run data` produces a validated catalogue of ~2,000 unique entries with a reviewable diff.

### Phase 1 — Core site

- [ ] Layout: nav, footer, dark mode via `next-themes`
- [ ] `ApiCard` — port the reference design, same badge colour semantics
- [ ] `/browse` with FlexSearch, category select, shuffle, reset, live count
- [ ] Filter rail: auth, HTTPS, CORS, health
- [ ] `/categories` and `/categories/[slug]`
- [ ] Responsive to 360px, keyboard accessible

### Phase 2 — Detail pages and SEO

- [ ] `/api/[slug]` via `generateStaticParams` for all ~2,000 entries
- [ ] Snippet tabs: curl, JavaScript fetch, Python requests, with copy button
- [ ] Metadata, Open Graph, `SoftwareApplication` / `Dataset` JSON-LD
- [ ] Dynamic OG images via `next/og`
- [ ] Split `sitemap.xml`, `robots.txt`, canonical URLs
- [ ] "Related APIs" internal linking

### Phase 3 — Trust layer

This is the differentiator and it also supplies the original data every blog post needs.

- [ ] `scripts/health-check.ts` — HEAD/GET every URL, record status, latency, redirect chain
- [ ] Daily Actions run, commit to `data/health.json`
- [ ] Status badge and "last verified" date on cards and detail pages
- [ ] **Probe CORS ourselves** to resolve the 1,003 unknowns
- [ ] `/status` dashboard: uptime, recently-died, slowest responders
- [ ] Filter and sort by health

### Phase 4 — Blog infrastructure

- [ ] MDX pipeline with frontmatter typed against the `Post` model
- [ ] `/blog`, `/blog/[slug]`, `/blog/category/[cluster]`
- [ ] Author system and `/authors/[slug]` pages
- [ ] Reading time, table of contents, copy-button code blocks
- [ ] `Article` + `FAQPage` JSON-LD
- [ ] Image pipeline per §10.4
- [ ] Related-posts and related-APIs components
- [ ] RSS feed

### Phase 5 — Content and compliance

- [ ] Write and publish all 50 posts on the §9 cadence
- [ ] Build all required legal and trust pages from §8.3
- [ ] Cookie consent banner
- [ ] Google Search Console and analytics wired up
- [ ] Full internal linking pass
- [ ] Lighthouse green across the board
- [ ] Wait for 4–6 weeks of organic traffic
- [ ] **Apply to AdSense**
- [ ] On approval: `ads.txt`, then place units per §8.4

### Phase 6 — Growth

- [ ] Publish our own JSON API at `/api/v1/apis.json` — useful, ironic, and a backlink magnet
- [ ] `⌘K` command palette
- [ ] Try-it-now playground for the 651+ no-auth CORS-enabled entries
- [ ] Compare view, two or three APIs side by side
- [ ] Favourites in `localStorage`
- [ ] Curated collections
- [ ] Submission flow via GitHub issue template
- [ ] Optional: self-hosted practice endpoints, following the FreeAPI.app pattern from §2.3

---

## 12. Risks

| Risk | Mitigation |
| --- | --- |
| An upstream list dies, as publicapis.org did | Data committed to git. Builds keep working from the last good snapshot. |
| **AdSense rejection for "low value content"** | §8.3 checklist in full. 1,500+ words per post, original data in every one, real authors, 4–6 weeks of traffic first. |
| **Unsplash API guideline breach** | Do not use the API for hero images. Download under the License and self-host. See §10.1. |
| Stock-photo-heavy posts read as thin | Original diagrams and real screenshots in every post, per §10.2. |
| Publishing 50 posts too fast looks automated | Staged 12-week cadence in §9. |
| Health checks get us rate-limited or IP-blocked | Throttle, stagger, respect `robots.txt`, real User-Agent, HEAD before GET. |
| Health job runs long across 2,000 URLs | Concurrency cap ~20, shard across runs, 10s timeout. |
| Ads damage Core Web Vitals and rankings | Reserve slot heights, cap at three per article, none on `/browse`. |
| Listing an API that has gone malicious | Health check flags redirect-chain and domain changes for manual review. |
| Daily CI commits bloat git history | Single health JSON file, squash the bot branch periodically. |
| Crowded market, no traction | Compete on verified freshness and depth, not entry count. |

---

## 13. Decisions to confirm

1. **Framework** — Next.js 15 recommended. Astro if you want a leaner bundle.
2. **Hosting** — Vercel recommended. Cloudflare Pages equally good. GitHub Pages works with static export.
3. **Domain** — needed early. AdSense will not approve a free subdomain, and the domain should be live and
   ageing while we write.
4. **Authors** — E-E-A-T needs real people with real credentials. Are you the sole author, or will there be
   others? This affects the author-page design and is not something we can fake.
5. **Unsplash approach** — recommended path is manual download under the License (§10.1). Confirm, or say you
   want the hotlink-and-attribute API path instead and I will build that.
6. **Post length** — 1,500–2,500 words each across 50 posts is roughly 75,000–125,000 words. Confirm you want
   all 50 written here, or whether you want a subset drafted and a template for the rest.

---

## 14. Sequencing note

Phase 0 is the real work and the real risk. Phases 1 and 2 are comparatively mechanical once the catalogue is
clean and typed. Phase 3 matters more than it looks: the health dataset is not just a feature, it is the
original research that makes the blog defensible and the AdSense application approvable.

Resist starting with the pretty card grid. The reference project proves that a beautiful front end on an
unowned data source is one DNS change away from being a blank page.
