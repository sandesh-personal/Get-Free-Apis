'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SUGGESTIONS = ['weather', 'currency', 'movies', 'crypto', 'no key'];

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function go(value: string) {
    const trimmed = value.trim();
    router.push(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : '/browse');
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised p-1.5 shadow-sm focus-within:border-accent"
      >
        <svg viewBox="0 0 24 24" className="ml-2 size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 2,700+ APIs — try “weather” or “currency”"
          aria-label="Search APIs"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
        <span>Popular:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className="rounded-full border border-border-subtle px-2.5 py-1 transition hover:border-accent hover:text-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
