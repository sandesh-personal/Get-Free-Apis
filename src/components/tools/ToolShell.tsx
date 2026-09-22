import Link from 'next/link';
import type { Tool } from '@/lib/tools';
import { site } from '@/lib/site';

/**
 * Shared frame for a tool page: breadcrumb, heading, the tool itself, then the
 * "what it does" list and a route back into the directory.
 *
 * The JSON-LD lives here too, so every tool is described consistently and none can
 * ship without it. `price: 0` is not decoration — it is what makes these eligible
 * for the free-tool treatment in search results.
 */
export function ToolShell({ tool, children }: { tool: Tool; children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    description: tool.description,
    url: `${site.url}/tools/${tool.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${site.url}/tools` },
      { '@type': 'ListItem', position: 3, name: tool.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="type-meta mb-5 flex flex-wrap items-center gap-1.5 text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{tool.name}</span>
        </nav>

        <header className="mb-6">
          <h1 className="type-h1">{tool.title}</h1>
          <p className="type-lead mt-3 max-w-2xl text-pretty text-muted">{tool.intro}</p>
        </header>

        {children}

        <section className="mt-10 rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="type-h2">What this does</h2>
          <ul className="mt-3 space-y-1.5">
            {tool.highlights.map((h) => (
              <li key={h} className="type-card-body flex gap-2 text-muted-strong">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
        </section>

        <p className="type-card-body mt-6 text-muted">
          Looking for an API to try it against?{' '}
          <Link href="/collections/no-api-key" className="font-medium text-accent hover:underline">
            Browse APIs that need no key
          </Link>{' '}
          — you can call those straight from this page.
        </p>
      </div>
    </>
  );
}

/**
 * The panel every tool renders its input and output into, so they share one visual
 * rhythm rather than each inventing a layout.
 */
export function ToolPanel({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface-raised p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-h2">{label}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
