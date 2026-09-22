'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { ToolPanel } from './ToolShell';

/*
 * The wall clock, read as the external source it is rather than by calling
 * Date.now() during render. Bucketing to 30s keeps the snapshot stable between
 * reads (so React does not loop) while still letting a token that expires while
 * you are looking at it flip to "Expired" on its own.
 */
const TICK_MS = 30_000;

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

function clockSnapshot() {
  return Math.floor(Date.now() / TICK_MS);
}

/**
 * Decodes a JWT locally. Nothing is transmitted — a token is a credential, and a
 * decoder that posts it somewhere is a credential-harvesting form.
 *
 * The signature is shown but deliberately NOT verified: verifying needs the signing
 * secret or public key, and asking someone to paste their signing secret into a web
 * page is exactly the habit a tool like this should not teach.
 */
type Decoded = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  expiresAt: Date | null;
  issuedAt: Date | null;
  notBefore: Date | null;
};

function base64UrlDecode(part: string): string {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const binary = atob(padded);
  // Round-trip through percent-encoding so non-ASCII claims survive.
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toDate(claim: unknown): Date | null {
  if (typeof claim !== 'number') return null;
  const d = new Date(claim * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

const CLAIM_NAMES: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT ID',
  scope: 'Scope',
  email: 'Email',
  name: 'Name',
};

export function JwtDecoder() {
  const [token, setToken] = useState('');

  const result = useMemo((): { decoded: Decoded | null; error: string | null } => {
    const raw = token.trim();
    if (!raw) return { decoded: null, error: null };

    const parts = raw.split('.');
    if (parts.length !== 3) {
      return {
        decoded: null,
        error: `A JWT has three dot-separated parts; this has ${parts.length}.`,
      };
    }

    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      return {
        decoded: {
          header,
          payload,
          signature: parts[2],
          expiresAt: toDate(payload.exp),
          issuedAt: toDate(payload.iat),
          notBefore: toDate(payload.nbf),
        },
        error: null,
      };
    } catch {
      return { decoded: null, error: 'Could not decode that — the header or payload is not valid base64url JSON.' };
    }
  }, [token]);

  const { decoded, error } = result;

  const tick = useSyncExternalStore(subscribeToClock, clockSnapshot, () => 0);
  const now = tick * TICK_MS;
  const expired = decoded?.expiresAt ? decoded.expiresAt.getTime() < now : null;

  return (
    <div className="space-y-4">
      <ToolPanel label="Token">
        <label htmlFor="jwt-input" className="sr-only">
          JSON Web Token
        </label>
        <textarea
          id="jwt-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.signature"
          aria-invalid={error ? true : undefined}
          aria-describedby="jwt-privacy"
          className={`type-code w-full resize-y break-all rounded-lg border bg-surface p-3 text-code outline-none transition ${
            error ? 'border-no focus:border-no' : 'border-border-subtle focus:border-accent'
          }`}
        />

        {error && (
          <p role="alert" className="type-meta mt-2 text-no">
            {error}
          </p>
        )}

        <p id="jwt-privacy" className="type-meta mt-2 flex items-start gap-1.5 text-muted">
          <svg viewBox="0 0 24 24" className="mt-0.5 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Decoding happens in this page. Your token is never sent to us or to anyone else — but
          remember a JWT is a credential, so avoid pasting production tokens into any website.
        </p>
      </ToolPanel>

      {decoded && (
        <>
          {decoded.expiresAt && (
            <div
              className={`rounded-xl border p-4 ${
                expired ? 'border-no bg-no-bg' : 'border-ok bg-ok-bg'
              }`}
            >
              <p className={`type-card-title flex items-center gap-2 ${expired ? 'text-no' : 'text-ok'}`}>
                <span aria-hidden className={`size-2.5 rounded-full ${expired ? 'bg-no' : 'bg-ok'}`} />
                {expired ? 'Expired' : 'Not expired'}
              </p>
              <p className="type-card-body mt-1 text-muted-strong">
                {expired ? 'Expired' : 'Expires'} {decoded.expiresAt.toLocaleString('en-GB')} (
                {relative(decoded.expiresAt, now)})
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ToolPanel label="Header">
              <pre className="type-code overflow-x-auto rounded-lg border border-border-subtle bg-surface p-3 text-code">
                <code>{JSON.stringify(decoded.header, null, 2)}</code>
              </pre>
            </ToolPanel>

            <ToolPanel label="Payload">
              <pre className="type-code overflow-x-auto rounded-lg border border-border-subtle bg-surface p-3 text-code">
                <code>{JSON.stringify(decoded.payload, null, 2)}</code>
              </pre>
            </ToolPanel>
          </div>

          <ToolPanel label="Claims">
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full">
                <tbody>
                  {Object.entries(decoded.payload).map(([k, v]) => {
                    const asDate = ['exp', 'iat', 'nbf'].includes(k) ? toDate(v) : null;
                    return (
                      <tr key={k} className="border-b border-[var(--border)] last:border-0">
                        <td className="type-code px-3 py-2 align-top text-muted">{k}</td>
                        <td className="type-card-body px-3 py-2 align-top text-muted">
                          {CLAIM_NAMES[k] ?? ''}
                        </td>
                        <td className="type-card-body break-all px-3 py-2 align-top">
                          {asDate
                            ? `${asDate.toLocaleString('en-GB')} (${relative(asDate, now)})`
                            : typeof v === 'object'
                              ? JSON.stringify(v)
                              : String(v)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ToolPanel>

          <ToolPanel label="Signature">
            <p className="type-code break-all rounded-lg border border-border-subtle bg-surface p-3 text-code">
              {decoded.signature}
            </p>
            <p className="type-meta mt-2 text-muted">
              Shown, not verified. Checking a signature requires the signing secret or public key,
              and you should not paste either into a web page.
            </p>
          </ToolPanel>
        </>
      )}
    </div>
  );
}

function relative(date: Date, now: number): string {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [31_536_000_000, 'year'],
    [2_592_000_000, 'month'],
    [86_400_000, 'day'],
    [3_600_000, 'hour'],
    [60_000, 'minute'],
    [1000, 'second'],
  ];

  const fmt = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
  for (const [ms, unit] of units) {
    if (abs >= ms) return fmt.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}
