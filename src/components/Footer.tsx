import Link from 'next/link';
import { footerNav, site } from '@/lib/site';
import { stats } from '@/lib/apis';

export function Footer() {
  const updated = new Date(stats.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <footer className="mt-20 border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span aria-hidden>🔌</span>
              <span>
                Get<span className="text-accent">Free</span>APIs
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">{site.tagline}.</p>
            <p className="mt-3 text-xs text-muted">
              {stats.total.toLocaleString('en-GB')} APIs indexed
              <br />
              Catalogue updated {updated}
            </p>
          </div>

          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{heading}</h2>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border-subtle pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. Listings are aggregated from public
            sources and verified independently.
          </p>
          <p>
            Data from{' '}
            <a
              href="https://github.com/public-apis/public-apis"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-accent"
            >
              public-apis
            </a>
            ,{' '}
            <a
              href="https://github.com/public-api-lists/public-api-lists"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-accent"
            >
              public-api-lists
            </a>{' '}
            and{' '}
            <a
              href="https://www.freepublicapis.com/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-accent"
            >
              freepublicapis
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
