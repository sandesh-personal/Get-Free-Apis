'use client';

import { useSyncExternalStore } from 'react';
import { readTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme';

/**
 * A straight light/dark switch. Light is the default, so the server and the first
 * client render agree and there is nothing to reconcile on hydration.
 */
function getServerSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, getServerSnapshot);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      /* 44px on touch, the Apple HIG minimum; 36px is fine for a mouse. */
      className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-subtle text-muted-strong transition hover:border-accent hover:text-accent md:size-9 ${className}`}
    >
      {/*
        Shows the mode you would switch TO, which is what the label says. Both glyphs
        are rendered and one is hidden, so the swap cannot flash a missing icon.
      */}
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {next === 'dark' ? (
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        )}
      </svg>
    </button>
  );
}
