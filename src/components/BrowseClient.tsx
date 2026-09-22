'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { expandRow, type BrowseRow, type Category } from '@/lib/apis';
import { ApiCard } from './ApiCard';

type SortKey = 'relevance' | 'name' | 'health' | 'fastest';

const PAGE_SIZE = 48;

/**
 * Auth is multi-select now, per the blueprint's filter sidebar: the useful question
 * is "no key or OAuth, but not a key", which a single-choice dropdown cannot ask.
 * An empty set means no auth constraint rather than no results.
 */
const AUTH_FILTERS = [
  { value: 'none', label: 'No Key' },
  { value: 'apiKey', label: 'Key' },
  { value: 'oauth', label: 'OAuth' },
] as const;

type AuthValue = (typeof AUTH_FILTERS)[number]['value'];

/** Minimum reliability, as the sidebar's uptime tiers. */
const UPTIME_TIERS = [
  { value: 0, label: 'Any' },
  { value: 95, label: '95%+' },
  { value: 98, label: '98%+' },
  { value: 100, label: '100%' },
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

/**
 * `lockedCategory` pins the view to one category and swaps the category dropdown for
 * a chip naming it. That is what the category pages render, so /browse and
 * /categories/[slug] are the same component and behave identically.
 */
export function BrowseClient({
  rows: initialRows,
  categories,
  lockedCategory,
  indexUrl,
}: {
  rows: BrowseRow[];
  categories: Category[];
  lockedCategory?: Category;
  /**
   * When set, `rows` is only the first batch and the full index is fetched from here
   * after mount. /browse uses it to keep ~160 KB of rows out of its HTML; category
   * pages pass their own (small) rows directly and leave this unset.
   */
  indexUrl?: string;
}) {
  const searchParams = useSearchParams();

  /*
   * The fetched index is held separately and only *overrides* the prop, rather than
   * seeding state from it. Seeding would freeze the first render's rows, so a
   * client-side navigation between two category pages that reused this component
   * would keep showing the previous category's APIs.
   */
  const [fetchedRows, setFetchedRows] = useState<BrowseRow[] | null>(null);
  const rows = fetchedRows ?? initialRows;
  const [loadingIndex, setLoadingIndex] = useState(Boolean(indexUrl));

  useEffect(() => {
    if (!indexUrl) return;
    let cancelled = false;

    fetch(indexUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((full: BrowseRow[] | null) => {
        if (cancelled || !full) return;
        setFetchedRows(full);
      })
      .catch(() => {
        // Keep the server-rendered first batch rather than emptying the grid.
      })
      .finally(() => {
        if (!cancelled) setLoadingIndex(false);
      });

    return () => {
      cancelled = true;
    };
  }, [indexUrl]);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(
    lockedCategory?.slug ?? searchParams.get('category') ?? 'all',
  );
  const initialAuth = searchParams.get('auth');
  const [auth, setAuth] = useState<AuthValue[]>(
    AUTH_FILTERS.some((f) => f.value === initialAuth) ? [initialAuth as AuthValue] : [],
  );
  const [corsOnly, setCorsOnly] = useState(false);
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [minUptime, setMinUptime] = useState(0);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLParagraphElement>(null);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    let list = rows.filter((row) => {
      if (category !== 'all' && row.s !== category) return false;
      if (auth.length > 0 && !auth.includes(row.a as AuthValue)) return false;
      if (corsOnly && row.o !== 'yes') return false;
      if (httpsOnly && row.h !== 1) return false;
      if (liveOnly && row.t !== 'live') return false;
      if (minUptime > 0 && (row.r ?? row.v ?? -1) < minUptime) return false;
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
  }, [rows, query, category, auth, corsOnly, httpsOnly, liveOnly, minUptime, sort, shuffleSeed]);

  // Only the visible slice is expanded back into full card objects.
  const shown = useMemo(() => results.slice(0, visible).map(expandRow), [results, visible]);

  function reset() {
    setQuery('');
    setCategory(lockedCategory?.slug ?? 'all');
    setAuth([]);
    setCorsOnly(false);
    setHttpsOnly(false);
    setLiveOnly(false);
    setMinUptime(0);
    setSort('relevance');
    setShuffleSeed(0);
    setVisible(PAGE_SIZE);
  }

  function toggleAuth(value: AuthValue) {
    setAuth((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
    setVisible(PAGE_SIZE);
  }

  /**
   * Collapse the filter panel (mobile only — it is always open on desktop) and bring
   * the matches into view.
   */
  function showResults() {
    setFiltersOpen(false);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Drives the "N active" count and whether Reset is worth offering. */
  const activeFilters =
    auth.length +
    (category !== 'all' && !lockedCategory ? 1 : 0) +
    (corsOnly ? 1 : 0) +
    (httpsOnly ? 1 : 0) +
    (liveOnly ? 1 : 0) +
    (minUptime > 0 ? 1 : 0);

  const selectClass =
    'rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent';

  const filterPanel = (
    <div className="space-y-6">
      <FilterGroup label="Auth Type">
        {AUTH_FILTERS.map((f) => (
          <CheckRow
            key={f.value}
            checked={auth.includes(f.value)}
            onChange={() => toggleAuth(f.value)}
            label={f.label}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="CORS support">
        <CheckRow
          checked={corsOnly}
          onChange={(v) => {
            setCorsOnly(v);
            setVisible(PAGE_SIZE);
          }}
          label="CORS"
        />
        <CheckRow
          checked={httpsOnly}
          onChange={(v) => {
            setHttpsOnly(v);
            setVisible(PAGE_SIZE);
          }}
          label="HTTPS"
        />
        <CheckRow
          checked={liveOnly}
          onChange={(v) => {
            setLiveOnly(v);
            setVisible(PAGE_SIZE);
          }}
          label="Verified live"
        />
      </FilterGroup>

      {!lockedCategory && (
        <FilterGroup label="Category">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            aria-label="Filter by category"
            className={`w-full ${selectClass}`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </FilterGroup>
      )}

      <FilterGroup label="Uptime">
        <div className="flex flex-wrap gap-1.5">
          {UPTIME_TIERS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={minUptime === t.value}
              onClick={() => {
                setMinUptime(t.value);
                setVisible(PAGE_SIZE);
              }}
              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                minUptime === t.value
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border-subtle text-muted hover:border-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/*
        Filtering is already live, so this button's job is to take you to the result
        of it: on a phone the panel covers the grid, so it collapses the panel and
        scrolls the matches into view. It also states the count, which is the
        confirmation people are looking for when they reach for a "search" button.
      */}
      <button
        type="button"
        onClick={showResults}
        className="type-nav w-full cursor-pointer rounded-lg bg-accent px-3 py-2.5 font-semibold text-accent-on transition hover:bg-accent-hover"
      >
        {loadingIndex
          ? 'Search'
          : `Search · ${results.length.toLocaleString('en-GB')} ${results.length === 1 ? 'match' : 'matches'}`}
      </button>

      <button
        type="button"
        onClick={reset}
        disabled={activeFilters === 0 && !query}
        className="type-nav w-full cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-muted transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      {/*
        Sidebar on desktop, collapsible panel on small screens. It is one DOM node
        rather than two so the filter state cannot diverge between breakpoints.
      */}
      <aside className="lg:sticky lg:top-20 lg:w-56 lg:shrink-0">
        <div className="mb-3 flex items-center justify-between lg:mb-4">
          <h2 className="type-h2">Filters</h2>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            className="cursor-pointer rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent hover:text-accent lg:hidden"
          >
            {filtersOpen ? 'Hide' : 'Show'}
            {activeFilters > 0 && ` (${activeFilters})`}
          </button>
        </div>

        <div id="filter-panel" className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          {filterPanel}
        </div>
      </aside>

      <div className="mt-6 min-w-0 flex-1 lg:mt-0">
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

          {lockedCategory && (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
              {lockedCategory.name}
              <Link
                href="/browse"
                title="Clear the category and search everything"
                className="text-background/70 transition hover:text-background"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
                <span className="sr-only">Clear category filter</span>
              </Link>
            </span>
          )}

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

          <button
            type="button"
            onClick={() => {
              setShuffleSeed(Date.now());
              setVisible(PAGE_SIZE);
            }}
            className="cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
          >
            Shuffle
          </button>
        </div>

        {/*
          While the index is still arriving the grid only holds the first batch, so
          saying "48 APIs found" would be wrong. Say what is actually happening
          instead.
        */}
        <p
          ref={resultsRef}
          className="mb-4 mt-4 scroll-mt-20 text-sm text-muted"
          aria-live="polite"
        >
          {loadingIndex ? (
            'Loading the full catalogue…'
          ) : (
            <>
              {results.length.toLocaleString('en-GB')} {results.length === 1 ? 'API' : 'APIs'} found
              {query && ` for “${query}”`}
            </>
          )}
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
              className="mt-4 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((api) => (
                <ApiCard key={api.id} api={api} />
              ))}
            </div>

            {visible < results.length && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="cursor-pointer rounded-lg border border-border-strong px-5 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent"
                >
                  Show more ({(results.length - visible).toLocaleString('en-GB')} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="type-footer-head mb-2 text-muted-strong">{label}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="type-nav flex cursor-pointer items-center gap-2 text-muted-strong transition hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer accent-[var(--accent)]"
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
