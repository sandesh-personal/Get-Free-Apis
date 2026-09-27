import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccessPanel } from '@/components/AccessPanel';
import { ApiCard } from '@/components/ApiCard';
import { AuthBadge, CorsBadge, HttpsBadge } from '@/components/Badge';
import { CodeTabs } from '@/components/CodeTabs';
import { Faq } from '@/components/Faq';
import { buildSnippets } from '@/lib/snippets';
import { uptimeProof } from '@/lib/uptime';
import { getAllApis, getApi, getCategory, getRelatedApis, isFree } from '@/lib/apis';
import { apiDescription, apiTitle, KEY_LABEL } from '@/lib/access';
import { apiFaq } from '@/lib/faq';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllApis().map((api) => ({ slug: api.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const api = getApi(slug);
  if (!api) return { title: 'API not found' };

  const title = apiTitle(api);
  const description = apiDescription(api);

  return {
    title,
    description,
    alternates: { canonical: `/apis/${api.id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${site.url}/apis/${api.id}`,
    },
  };
}

export default async function ApiDetailPage({ params }: Props) {
  const { slug } = await params;
  const api = getApi(slug);
  if (!api) notFound();

  const category = getCategory(api.categorySlug);
  const related = getRelatedApis(api);
  const snippets = buildSnippets(api);
  const proof = uptimeProof(api);
  const free = isFree(api);
  const discontinued = api.status === 'discontinued';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    name: api.name,
    description: api.description,
    documentation: api.url,
    url: `${site.url}/apis/${api.id}`,
    provider: { '@type': 'Organization', name: api.name },
    // Only claimed when we can back it: keyless, or verified free. Unknown means omitted.
    ...(free !== undefined && { isAccessibleForFree: free }),
    ...(category && { applicationCategory: category.name }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${site.url}/categories` },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: `${site.url}/categories/${category.slug}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: category ? 4 : 3,
        name: api.name,
        item: `${site.url}/apis/${api.id}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/categories" className="hover:text-accent">Categories</Link>
          {category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/categories/${category.slug}`} className="hover:text-accent">
                {category.name}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-foreground">{api.name}</span>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">{api.name}</h1>
              <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
                {api.description}
              </p>
            </div>

            <a
              href={api.url}
              target="_blank"
              rel="noreferrer nofollow"
              className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
            >
              Open documentation ↗
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <AuthBadge auth={api.auth} />
            <HttpsBadge https={api.https} />
            <CorsBadge cors={api.cors} />
            {category && (
              <Link
                href={`/categories/${category.slug}`}
                className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted transition hover:text-accent"
              >
                {category.name}
              </Link>
            )}
          </div>

          {/* The verification stamp the blueprint asks for, directly under the badges. */}
          {proof && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-full ${
                  proof.tone === 'live' ? 'bg-ok' : 'bg-no'
                }`}
              />
              {proof.label}
            </p>
          )}
        </header>

        <AccessPanel api={api} />

        {/* Facts */}
        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact
            label="API key"
            value={
              api.access
                ? KEY_LABEL[api.access.key]
                : api.auth === 'none'
                  ? 'Not required'
                  : api.auth === 'apiKey'
                    ? 'Required'
                    : api.auth === 'oauth'
                      ? 'OAuth flow'
                      : 'Unconfirmed'
            }
          />
          <Fact label="HTTPS" value={api.https ? 'Supported' : 'Not supported'} />
          <Fact
            label="Browser calls"
            value={api.cors === 'yes' ? 'Yes, CORS enabled' : api.cors === 'no' ? 'No, needs a proxy' : 'Unconfirmed'}
          />
          <Fact
            label="Status"
            value={
              discontinued
                ? 'Shut down'
                : api.health
                  ? `${api.status === 'live' ? 'Live' : 'Failing'} · ${api.health.score}/100`
                  : 'Not yet checked'
            }
          />
        </section>

        {api.health && !discontinued && (
          <section className="mb-10 rounded-xl border border-border-subtle bg-surface p-5">
            <h2 className="text-sm font-semibold">What our checks found</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Health score</dt>
                <dd className="text-2xl font-semibold tabular-nums">{api.health.score}<span className="text-sm text-muted">/100</span></dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Reliability</dt>
                <dd className="text-2xl font-semibold tabular-nums">{api.health.reliability}<span className="text-sm text-muted">%</span></dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Average latency</dt>
                <dd className="text-2xl font-semibold tabular-nums">{api.health.latencyMs}<span className="text-sm text-muted">ms</span></dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              Last checked {api.health.lastChecked}. Measured independently, not self-reported by
              the provider.
            </p>
          </section>
        )}

        {/* Usage. Pointless for an API that no longer exists; its alternatives are above. */}
        {!discontinued && (
        <section className="mb-10">
          <h2 className="mb-2 text-xl font-bold tracking-tight">How to call it</h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted">
            A starting template for {api.name}. Replace <code className="rounded bg-surface px-1 py-0.5 text-xs">ENDPOINT</code>{' '}
            with the path from the official documentation, which we link above rather than guess at.
          </p>
          <CodeTabs snippets={snippets} />

          {api.cors === 'no' && (
            <p className="mt-4 rounded-lg border border-border-subtle bg-unknown-bg p-3 text-xs leading-relaxed text-unknown">
              This API does not send CORS headers, so a browser will block a direct call from your
              front end. Call it from your server, or put a small proxy in front of it.
            </p>
          )}
          {!api.https && (
            <p className="mt-3 rounded-lg border border-border-subtle bg-no-bg p-3 text-xs leading-relaxed text-no">
              This API is served over plain HTTP. Browsers block HTTP requests made from an HTTPS
              page, so you will need a server-side call.
            </p>
          )}
        </section>
        )}

        {/* Provenance */}
        <section className="mb-10 rounded-xl border border-border-subtle p-5">
          <h2 className="text-sm font-semibold">Where this listing comes from</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Aggregated from {api.sources.length === 1 ? 'one public source' : `${api.sources.length} public sources`}
            {' '}({api.sources.join(', ')}), then normalised and checked by us.
          </p>
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent(
              `Correction: ${api.name}`,
            )}&body=${encodeURIComponent(
              `Listing: ${site.url}/apis/${api.id}\n\nWhat's wrong:\n\n\nWhat it should say (with a source if you have one):\n\n`,
            )}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            Report an issue with this listing ↗
          </a>
        </section>

        {related.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                Other {category?.name ?? 'similar'} APIs
              </h2>
              {category && (
                <Link href={`/categories/${category.slug}`} className="shrink-0 text-sm font-medium text-accent hover:underline">
                  See all {category.count} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ApiCard key={r.id} api={r} />
              ))}
            </div>
          </section>
        )}

        <Faq
          items={apiFaq(api)}
          heading={`${api.name} — common questions`}
          intro="Answered from what our own scheduled checks found, not from the provider's marketing."
        />
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
