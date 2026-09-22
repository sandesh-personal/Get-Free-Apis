'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "Quick Copy" from blueprint §2: the cURL for a listing without leaving the grid.
 *
 * The card is a link, so the click has to be stopped from bubbling or copying would
 * navigate away to the detail page instead.
 */
export function CopyCurl({ curl, name }: { curl: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The card can unmount while the grid is filtered, so the reset must be cancelled.
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy cURL command for ${name}`}
      className="type-badge inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-muted-strong transition hover:border-accent hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {copied ? (
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      {/* aria-live so the confirmation is announced, not just shown. */}
      <span aria-live="polite">{copied ? 'Copied' : 'GET cURL'}</span>
    </button>
  );
}
