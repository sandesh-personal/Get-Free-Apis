'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Search with typeahead suggestions drawn from the site's own content: collections,
 * categories and every API in the catalogue.
 *
 * The index is ~100 KB, so it is not shipped with the page. It is fetched once on the
 * first keystroke and cached in a module-level promise, which means every search box
 * on the site shares one download and suggestions are instant from the second letter
 * onward.
 *
 * Implements the ARIA combobox pattern: the input owns the listbox, the active option
 * is tracked with aria-activedescendant rather than by moving focus, and Up/Down,
 * Enter and Escape all behave as a keyboard user expects.
 */
type Entry = { t: 'a' | 'c' | 'k'; n: string; u: string; s?: string };

const KIND: Record<Entry['t'], string> = { a: 'API', c: 'Category', k: 'Collection' };

let indexPromise: Promise<Entry[]> | null = null;

function loadIndex(): Promise<Entry[]> {
  indexPromise ??= fetch('/search-index.json')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return indexPromise;
}

/**
 * Ranks an entry against the query. Returns -1 for no match.
 *
 * Exact beats prefix beats word-start beats substring, and collections and categories
 * are nudged above individual APIs so that typing "weather" offers the category
 * before it offers the twentieth weather API.
 */
function score(entry: Entry, q: string): number {
  const name = entry.n.toLowerCase();
  if (!name.includes(q)) {
    // Let a category still match on its subtitle, e.g. typing a category name.
    if (!entry.s?.toLowerCase().includes(q)) return -1;
    return 5;
  }

  let base: number;
  if (name === q) base = 100;
  else if (name.startsWith(q)) base = 75;
  else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) base = 55;
  else base = 30;

  const kindBonus = entry.t === 'k' ? 12 : entry.t === 'c' ? 8 : 0;
  // Shorter names are usually the more canonical match for the same rank.
  return base + kindBonus - Math.min(name.length, 40) / 40;
}

export function SearchBox({
  placeholder = 'Search APIs, categories and collections…',
  buttonLabel,
  size = 'sm',
  shortcutHint,
  className = '',
}: {
  placeholder?: string;
  /** Renders a submit button beside the field when set. */
  buttonLabel?: string;
  size?: 'sm' | 'md';
  shortcutHint?: string;
  className?: string;
}) {
  const router = useRouter();
  const uid = useId();
  const listboxId = `${uid}-listbox`;

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Close when focus or a click leaves the widget entirely.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const q = query.trim().toLowerCase();

  const suggestions =
    q.length === 0 || !index
      ? []
      : index
          .map((e) => ({ e, s: score(e, q) }))
          .filter((r) => r.s >= 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 8)
          .map((r) => r.e);

  const showList = open && q.length > 0 && suggestions.length > 0;

  function onChange(value: string) {
    setQuery(value);
    setActive(-1);
    setOpen(true);
    // First keystroke pulls the index; subsequent ones reuse the cached promise.
    if (value.trim() && !index) void loadIndex().then(setIndex);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function submit() {
    if (active >= 0 && suggestions[active]) {
      go(suggestions[active].u);
      return;
    }
    setOpen(false);
    router.push(q ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse');
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!showList) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  const pad = size === 'md' ? 'py-2.5' : 'py-1.5';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-stretch gap-2"
      >
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${uid}-opt-${active}` : undefined}
            aria-label="Search APIs, categories and collections"
            aria-keyshortcuts={shortcutHint ? 'Meta+K Control+K' : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setOpen(true);
              if (!index) void loadIndex().then(setIndex);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-border-subtle bg-surface-raised ${pad} pl-10 ${
              shortcutHint ? 'pr-16' : 'pr-4'
            } text-sm shadow-sm outline-none transition focus:border-accent placeholder:text-muted`}
          />

          {shortcutHint && (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border-subtle px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted lg:block"
            >
              {shortcutHint}
            </kbd>
          )}
        </div>

        {buttonLabel && (
          <button
            type="submit"
            className={`shrink-0 cursor-pointer rounded-lg bg-foreground px-5 ${pad} text-xs font-semibold text-background shadow-sm transition hover:opacity-90`}
          >
            {buttonLabel}
          </button>
        )}
      </form>

      {/*
        Always rendered so screen readers can announce the count, but only populated
        when there is something to show.
      */}
      <div className="sr-only" aria-live="polite">
        {showList ? `${suggestions.length} suggestions available` : ''}
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 mt-1.5 max-h-80 w-full overflow-y-auto rounded-lg border border-border-subtle bg-surface-raised py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.t}-${s.u}`}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // onMouseDown, not onClick: blur would close the list before a click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                go(s.u);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                i === active ? 'bg-surface' : ''
              }`}
            >
              <span className="min-w-0 flex-1 truncate font-medium">{s.n}</span>
              {s.s && <span className="shrink-0 text-xs text-muted">{s.s}</span>}
              <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {KIND[s.t]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
