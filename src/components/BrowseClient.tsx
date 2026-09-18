'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { expandRow, type BrowseRow, type Category } from '@/lib/apis';
import { ApiCard } from './ApiCard';

type SortKey = 'relevance' | 'name' | 'health' | 'fastest';

const PAGE_SIZE = 48;

const AUTH_FILTERS = [
  { value: 'any', label: 'Any auth' },
  { value: 'none', label: 'No key needed' },
  { value: 'apiKey', label: 'API key' },
  { value: 'oauth', label: 'OAuth' },
] as const;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'health', label: 'Healthiest' },
  { value: 'fastest', label: 'Fastest' },
];

/** Exact and prefix matches rank above substring hits. Every term must match somewhere. */
function matchScore(row: BrowseRow, terms: string[]): number {
  const name = row.n.toLowerCase();
  const description = row.d.toLowerCase();
  const category = row.c.toLowerCase();

  let total = 0;
  for (const term of terms) {
    let best = 0;
    if (name === term) best = 100;
    else if (name.startsWith(term)) best = 70;
    else if (name.includes(term)) best = 50;
    else if (category.includes(term)) best = 25;
    else if (description.includes(term)) best = 15;
    if (best === 0) return -1;
    total += best;
  }
  return total;
}

export function BrowseClient({ rows, categories }: { rows: BrowseRow[]; categories: Category[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all');
  const [auth, setAuth] = useState<string>(searchParams.get('auth') ?? 'any');
  const [corsOnly, setCorsOnly] = useState(false);
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    let list = rows.filter((row) => {
      if (category !== 'all' && row.s !== category) return false;
      if (auth !== 'any' && row.a !== auth) return false;
      if (corsOnly && row.o !== 'yes') return false;
      if (httpsOnly && row.h !== 1) return false;
      if (liveOnly && row.t !== 'live') return false;
      return true;
    });

    if (terms.length) {
      list = list
        .map((row) => ({ row, score: matchScore(row, terms) }))
        .filter((r) => r.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.row);
    }

    if (shuffleSeed > 0) {
      // Deterministic shuffle so re-renders do not reorder under the visitor.
      list = [...list].sort((a, b) => hash(a.i + shuffleSeed) - hash(b.i + shuffleSeed));
    } else if (sort === 'name' || (sort === 'relevance' && terms.length === 0)) {
      list = [...list].sort((a, b) => a.n.localeCompare(b.n));
    } else if (sort === 'health') {
      list = [...list].sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
    } else if (sort === 'fastest') {
      list = [...list].sort((a, b) => (a.l ?? Infinity) - (b.l ?? Infinity));
    }

    return list;
  }, [rows, query, category, auth, corsOnly, httpsOnly, liveOnly, sort, shuffleSeed]);

  // Only the visible slice is expanded back into full card objects.
  const shown = useMemo(() => results.slice(0, visible).map(expandRow), [results, visible]);

  function reset() {
    setQuery('');
    setCategory('all');
    setAuth('any');
    setCorsOnly(false);
    setHttpsOnly(false);
    setLiveOnly(false);
    setSort('relevance');
    setShuffleSeed(0);
    setVisible(PAGE_SIZE);
  }

  const selectClass =
    'rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent';

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-border-subtle bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-55 flex-1 items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 focus-within:border-accent">
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
                setShuffleSeed(0);
              }}
              placeholder="Search by name, description or category"
              aria-label="Search APIs"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            aria-label="Filter by category"
            className={selectClass}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={auth}
            onChange={(e) => {
              setAuth(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            aria-label="Filter by authentication"
            className={selectClass}
          >
            {AUTH_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setShuffleSeed(0);
            }}
            aria-label="Sort results"
            className={selectClass}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Toggle checked={corsOnly} onChange={setCorsOnly} label="CORS enabled" />
          <Toggle checked={httpsOnly} onChange={setHttpsOnly} label="HTTPS only" />
          <Toggle checked={liveOnly} onChange={setLiveOnly} label="Verified live" />

          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShuffleSeed(Date.now());
                setVisible(PAGE_SIZE);
              }}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
            >
              Shuffle
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
            >
              Reset
            </button>
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {results.length.toLocaleString('en-GB')} {results.length === 1 ? 'API' : 'APIs'} found
        {query && ` for “${query}”`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-medium">Nothing matched those filters</p>
          <p className="mt-1 text-sm text-muted">
            Try removing a filter, or search for something broader like “weather”.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((api) => (
              <ApiCard key={api.id} api={api} />
            ))}
          </div>

          {visible < results.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-lg border border-border-strong px-5 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent"
              >
                Show more ({(results.length - visible).toLocaleString('en-GB')} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        checked
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border-subtle text-muted hover:border-accent'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
