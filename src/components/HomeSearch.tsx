'use client';

import Link from 'next/link';
import { SearchBox } from './SearchBox';

/**
 * Real links to the destination each label promises, rather than buttons that ran a
 * search for the word. A visitor clicking "weather" wants the weather category, and
 * as anchors these also give the homepage internal links into the top categories
 * for crawlers to follow.
 */
const SUGGESTIONS = [
  { label: 'AI', href: '/categories/ai' },
  { label: 'weather', href: '/categories/weather' },
  { label: 'currency', href: '/categories/currency-exchange' },
  { label: 'movies', href: '/categories/video' },
  { label: 'crypto', href: '/categories/cryptocurrency' },
  { label: 'no key', href: '/collections/no-api-key' },
];

/**
 * The hero search. This is the only search field on the homepage — the header one is
 * hidden here so the two do not compete for the same job or the same shortcut.
 */
export function HomeSearch() {
  return (
    <div className="w-full">
      <SearchBox
        size="md"
        buttonLabel="Search APIs"
        placeholder="Search by topic, return format, or endpoint name…"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Popular:</span>
        {SUGGESTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-full border border-border-subtle px-2.5 py-1 transition hover:border-accent hover:text-accent"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
