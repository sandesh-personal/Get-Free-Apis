'use client';

import { useEffect, useRef, useState } from 'react';

/** Shared copy control for the tools, with the confirmation announced to screen readers. */
export function CopyButton({
  value,
  label = 'Copy',
  disabled,
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      disabled={disabled || !value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      className="type-badge inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-muted-strong transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? (
          <path d="m5 13 4 4L19 7" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}
