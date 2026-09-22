'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { nav } from '@/lib/site';
import { Logo } from './Logo';
import { NavSearch } from './NavSearch';
import { ThemeToggle } from './ThemeToggle';

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /*
   * The homepage hero and /browse each have their own search field. Showing the
   * header one there too would put two search boxes on the same screen competing for
   * the same job and the same shortcut.
   */
  const showSearch = pathname !== '/' && !isActive('/browse');

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="type-logo flex shrink-0 items-center gap-2">
          <Logo />
          <span>
            Get<span className="text-accent">Free</span>APIs
          </span>
        </Link>

        {showSearch && <NavSearch className="hidden max-w-xs flex-1 lg:flex" />}

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`type-nav rounded-lg px-3 py-1.5 transition ${
                isActive(item.href)
                  ? 'bg-surface text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/submit"
            className="type-nav ml-1 rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-on transition hover:bg-accent-hover"
          >
            Submit API
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-border-subtle text-muted transition hover:border-accent hover:text-accent md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border-subtle bg-background px-4 py-2 md:hidden">
          {showSearch && <NavSearch className="my-2 flex" />}

          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`type-nav block rounded-lg px-3 py-2 ${
                isActive(item.href) ? 'bg-surface text-foreground' : 'text-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/submit"
            onClick={() => setOpen(false)}
            className="type-nav my-2 block rounded-lg bg-accent px-3 py-2 text-center font-semibold text-accent-on"
          >
            Submit API
          </Link>
        </nav>
      )}
    </header>
  );
}
