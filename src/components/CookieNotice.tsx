'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { reopenConsent, setConsent } from '@/lib/consent';

/**
 * Consent gate for non-essential cookies, required for EEA and UK traffic before any
 * advertising or analytics script may run. See ROADMAP §8.3.
 *
 * The banner is always rendered on the server and hidden by CSS for anyone who has
 * already answered, using the `data-consent` attribute that `consentScript` writes
 * onto <html> before first paint. That avoids both a hydration mismatch and a flash
 * of the banner on every navigation.
 *
 * Accept and Reject are genuinely different: only Accept causes <ConsentedScripts />
 * to load anything. Nothing is stored at all until a button is pressed, which is the
 * part that actually matters legally.
 */
export function CookieNotice() {
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Publish the banner's real height so the stylesheet can reserve exactly that
   * much space at the bottom of the page. Being fixed, the banner otherwise sits
   * on top of the last strip of every page and silently swallows clicks there.
   * It wraps to two lines on narrow screens, so this is measured rather than
   * hard-coded, and re-measured when the viewport changes.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publish = () =>
      document.documentElement.style.setProperty(
        '--consent-height',
        // A little more than the banner itself, so content never ends flush
        // against it and there is always somewhere to scroll to.
        `${Math.ceil(el.getBoundingClientRect().height) + 24}px`,
      );

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--consent-height');
    };
  }, []);

  return (
    <div
      ref={ref}
      className="cookie-notice fixed inset-x-0 bottom-0 z-50 border-t border-border-strong bg-surface-raised p-4 shadow-lg"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          We use cookies only to measure traffic and, in future, to show ads. Nothing is
          stored until you choose, and you can change your mind at any time. Read our{' '}
          <Link href="/privacy" className="underline hover:text-accent">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent('rejected')}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setConsent('accepted')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer control that reopens the banner.
 *
 * Consent has to be withdrawable to be consent at all, and without this the choice
 * is permanent from the visitor's point of view — there is no other way back to it.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={reopenConsent} className={className}>
      Cookie settings
    </button>
  );
}
