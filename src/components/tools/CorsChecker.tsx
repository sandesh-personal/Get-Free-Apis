'use client';

import { useState } from 'react';
import { ToolPanel } from './ToolShell';

/**
 * Runs a real cross-origin request from the visitor's browser.
 *
 * Two honest limits, both surfaced in the UI rather than hidden:
 *
 * 1. A browser cannot read `Access-Control-Allow-Origin` off a blocked response —
 *    the whole point of the block is that the response is unreadable. So this
 *    reports the *outcome* (did the browser let the page read it) rather than
 *    pretending to inspect the header. The outcome is the question that matters.
 *
 * 2. A failed `fetch` is indistinguishable from a network error by design. A second
 *    `no-cors` probe tells the two apart: if that succeeds the host is reachable and
 *    CORS is what stopped us; if it also fails, the endpoint is down or unreachable.
 */
type Result = {
  verdict: 'allowed' | 'blocked' | 'unreachable';
  status?: number;
  statusText?: string;
  ms: number;
  headers: [string, string][];
  note: string;
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function CorsChecker() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<(typeof METHODS)[number]>('GET');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    let target: URL;
    try {
      target = new URL(url.trim());
      if (!/^https?:$/.test(target.protocol)) throw new Error('bad protocol');
    } catch {
      setError('Enter a full URL including https://');
      return;
    }

    if (target.protocol === 'http:' && window.location.protocol === 'https:') {
      setError(
        'This page is served over HTTPS, so the browser will block a plain http:// request as mixed content before CORS is even considered.',
      );
      return;
    }

    setBusy(true);
    const started = performance.now();

    try {
      const response = await fetch(target.toString(), { method, mode: 'cors' });
      const ms = Math.round(performance.now() - started);

      setResult({
        verdict: 'allowed',
        status: response.status,
        statusText: response.statusText,
        ms,
        headers: [...response.headers.entries()],
        note:
          response.status >= 400
            ? 'CORS allowed the request through — the error status is the API answering, not the browser blocking.'
            : 'The browser allowed this page to read the response. You can call this endpoint from front-end JavaScript.',
      });
    } catch {
      // Distinguish a CORS rejection from the host simply being unreachable.
      const ms = Math.round(performance.now() - started);
      let reachable = false;
      try {
        await fetch(target.toString(), { method: 'GET', mode: 'no-cors' });
        reachable = true;
      } catch {
        reachable = false;
      }

      setResult(
        reachable
          ? {
              verdict: 'blocked',
              ms,
              headers: [],
              note:
                'The host responded, but the browser refused to hand the response to this page. The endpoint does not send CORS headers that allow this origin, so you need a server-side proxy to call it from a browser.',
            }
          : {
              verdict: 'unreachable',
              ms,
              headers: [],
              note:
                'No response at all — the host is down, the name does not resolve, or a network-level block is in the way. This is not a CORS result.',
            },
      );
    } finally {
      setBusy(false);
    }
  }

  /*
   * Written out in full rather than built with a template literal: Tailwind scans
   * source text for class names, so `text-${tone}` would never be generated.
   */
  const VERDICT = {
    allowed: { text: 'text-ok', dot: 'bg-ok', label: 'CORS allowed' },
    blocked: { text: 'text-no', dot: 'bg-no', label: 'Blocked by CORS' },
    unreachable: { text: 'text-unknown', dot: 'bg-unknown', label: 'No response' },
  } as const;

  return (
    <div className="space-y-4">
      <ToolPanel label="Endpoint">
        <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="cors-method" className="sr-only">
            HTTP method
          </label>
          <select
            id="cors-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 outline-none focus:border-accent"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label htmlFor="cors-url" className="sr-only">
            Endpoint URL
          </label>
          {/*
            Deliberately type="text" with inputMode="url" rather than type="url".
            Native URL validation silently blocks the submit, so the handler never
            runs and the visitor gets a generic browser tooltip instead of the
            specific advice below — including the mixed-content case, which the
            browser has no way to explain.
          */}
          <input
            id="cors-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/items"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'cors-error' : undefined}
            className={`min-w-0 flex-1 rounded-lg border bg-surface-raised px-3 py-2.5 outline-none transition ${
              error ? 'border-no focus:border-no' : 'border-border-subtle focus:border-accent'
            }`}
          />

          <button
            type="submit"
            disabled={busy}
            className="shrink-0 cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-accent-on transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Testing…' : 'Test CORS'}
          </button>
        </form>

        {error && (
          <p id="cors-error" role="alert" className="type-meta mt-2 text-no">
            {error}
          </p>
        )}
      </ToolPanel>

      {result && (
        <ToolPanel label="Result">
          <div aria-live="polite">
            <p className={`type-card-title flex items-center gap-2 ${VERDICT[result.verdict].text}`}>
              <span
                aria-hidden
                className={`size-2.5 shrink-0 rounded-full ${VERDICT[result.verdict].dot}`}
              />
              {VERDICT[result.verdict].label}
            </p>

            <p className="type-card-body mt-2 text-muted-strong">{result.note}</p>

            <dl className="mt-4 grid gap-2 sm:grid-cols-3">
              <Fact label="Status" value={result.status ? `${result.status} ${result.statusText}` : '—'} />
              <Fact label="Round trip" value={`${result.ms} ms`} />
              <Fact label="Readable headers" value={String(result.headers.length)} />
            </dl>

            {result.headers.length > 0 && (
              <div className="mt-4">
                <h3 className="type-footer-head mb-2 text-muted-strong">
                  Headers this page can read
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="w-full">
                    <tbody>
                      {result.headers.map(([k, v]) => (
                        <tr key={k} className="border-b border-[var(--border)] last:border-0">
                          <td className="type-code px-3 py-1.5 align-top text-muted">{k}</td>
                          <td className="type-code px-3 py-1.5 break-all text-code">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="type-meta mt-2 text-muted">
                  Browsers only expose a handful of headers to scripts unless the server lists more
                  in <code className="type-code text-code">Access-Control-Expose-Headers</code>, so
                  this is usually shorter than what the server actually sent.
                </p>
              </div>
            )}
          </div>
        </ToolPanel>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
      <dt className="type-stat-label text-muted">{label}</dt>
      <dd className="type-card-title break-words">{value}</dd>
    </div>
  );
}
