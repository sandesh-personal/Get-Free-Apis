import Link from 'next/link';
import { Logo } from './Logo';
import { CookieSettingsButton } from './CookieNotice';
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
            <Link href="/" className="type-logo flex items-center gap-2">
              <Logo />
              <span>
                Get<span className="text-accent">Free</span>APIs
              </span>
            </Link>
            <p className="type-card-body mt-3 text-muted">{site.tagline}</p>
            <p className="type-meta mt-3 text-muted">
              {stats.total.toLocaleString('en-GB')} APIs indexed
              <br />
              Catalogue updated {updated}
            </p>
          </div>

          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h2 className="type-footer-head mb-3 text-foreground">{heading}</h2>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="type-nav text-muted transition hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="type-legal mt-10 flex flex-col gap-3 border-t border-border-subtle pt-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              &copy; {new Date().getFullYear()} {site.name}. Listings are aggregated from public
              sources and verified independently.
            </span>
            <span aria-hidden>&middot;</span>
            <CookieSettingsButton className="underline underline-offset-2 hover:text-accent" />
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
