import Link from 'next/link';
import type { Metadata } from 'next';
import { tools } from '@/lib/tools';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free Developer Tools — cURL Converter, JSON Formatter, CORS Checker',
  description:
    'Free browser-based tools for working with APIs: convert cURL to fetch or Python, format and validate JSON, test CORS, and decode JWTs. No sign-up, nothing uploaded.',
  alternates: { canonical: '/tools' },
};

export default function ToolsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free developer tools',
    itemListElement: tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `${site.url}/tools/${tool.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8 max-w-2xl">
          <h1 className="type-h1">Developer tools</h1>
          <p className="type-lead mt-3 text-pretty text-muted">
            Small tools for the jobs that come up while wiring an API into something. Every one runs
            entirely in your browser — nothing is uploaded, there is no sign-up, and there is no
            limit on how often you use them.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm transition hover:border-accent hover:bg-surface"
            >
              <h2 className="type-card-title transition-colors group-hover:text-accent">
                {tool.name}
              </h2>
              <p className="type-card-body mt-2 flex-1 text-muted">{tool.blurb}</p>
              <span className="type-badge mt-3 text-accent">Open tool →</span>
            </Link>
          ))}
        </div>

        <p className="type-card-body mt-8 max-w-2xl text-muted">
          These pair with the{' '}
          <Link href="/browse" className="font-medium text-accent hover:underline">
            API directory
          </Link>
          : find an endpoint that needs no key, then test it here before writing any code.
        </p>
      </div>
    </>
  );
}
