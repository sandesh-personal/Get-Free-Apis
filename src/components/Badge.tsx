import type { Auth, Cors, Status } from '@/lib/apis';

/**
 * `noAuth` is separate from `ok` because the blueprint gives the no-auth tag its own
 * colour (sky blue) and reserves emerald for health — an endpoint can need no key and
 * still be down, so the two facts must not share a swatch.
 */
type Tone = 'ok' | 'noAuth' | 'key' | 'oauth' | 'no' | 'unknown' | 'neutral';

const TONE: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok',
  noAuth: 'bg-no-auth-bg text-no-auth',
  key: 'bg-key-bg text-key',
  oauth: 'bg-oauth-bg text-oauth',
  no: 'bg-no-bg text-no',
  unknown: 'bg-unknown-bg text-unknown',
  neutral: 'bg-surface text-muted',
};

export function Badge({
  tone = 'neutral',
  children,
  title,
}: {
  tone?: Tone;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`type-badge inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

const AUTH_LABEL: Record<Auth, { label: string; tone: Tone; title: string }> = {
  none: { label: 'No key', tone: 'noAuth', title: 'No authentication required' },
  apiKey: { label: 'API key', tone: 'key', title: 'Requires an API key' },
  oauth: { label: 'OAuth', tone: 'oauth', title: 'Requires OAuth' },
  other: { label: 'Auth', tone: 'unknown', title: 'Authentication requirement not confirmed' },
};

export function AuthBadge({ auth }: { auth: Auth }) {
  const { label, tone, title } = AUTH_LABEL[auth];
  return (
    <Badge tone={tone} title={title}>
      {label}
    </Badge>
  );
}

export function HttpsBadge({ https }: { https: boolean }) {
  return https ? (
    <Badge tone="ok" title="Served over HTTPS">
      HTTPS
    </Badge>
  ) : (
    <Badge tone="no" title="No HTTPS. Browsers block this from a secure page.">
      No HTTPS
    </Badge>
  );
}

const CORS_LABEL: Record<Cors, { label: string; tone: Tone; title: string }> = {
  yes: { label: 'CORS', tone: 'ok', title: 'CORS enabled, callable from the browser' },
  no: { label: 'No CORS', tone: 'no', title: 'No CORS. Call it from a server or a proxy.' },
  unknown: { label: 'CORS?', tone: 'unknown', title: 'CORS support not yet confirmed' },
};

export function CorsBadge({ cors }: { cors: Cors }) {
  const { label, tone, title } = CORS_LABEL[cors];
  return (
    <Badge tone={tone} title={title}>
      {label}
    </Badge>
  );
}

/**
 * Attribute rows: a plain-language label with a colour block beside it.
 *
 * This replaces the compact pill badges on cards. Pills make you read four short
 * abbreviations; a labelled row states the fact outright, and the colour lets you
 * scan a grid of cards without reading anything at all.
 *
 * The colour alone never carries the meaning — the label always says it too — so
 * this stays legible to anyone who cannot distinguish the swatches.
 */
const SWATCH: Record<Tone, string> = {
  ok: 'bg-ok',
  noAuth: 'bg-no-auth',
  key: 'bg-key',
  oauth: 'bg-oauth',
  no: 'bg-no',
  unknown: 'bg-unknown',
  neutral: 'bg-border-strong',
};

export function AttributeRow({ label, tone }: { label: string; tone: Tone }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-strong">{label}</span>
      <span aria-hidden className={`h-5 w-9 shrink-0 rounded ${SWATCH[tone]}`} />
    </div>
  );
}

const AUTH_ROW: Record<Auth, { label: string; tone: Tone }> = {
  none: { label: 'No authorization', tone: 'noAuth' },
  apiKey: { label: 'API key authorization', tone: 'key' },
  oauth: { label: 'OAuth authorization', tone: 'oauth' },
  other: { label: 'Authorization unconfirmed', tone: 'unknown' },
};

const CORS_ROW: Record<Cors, { label: string; tone: Tone }> = {
  yes: { label: 'CORS available', tone: 'ok' },
  no: { label: 'CORS unavailable', tone: 'no' },
  unknown: { label: 'CORS unknown', tone: 'unknown' },
};

export function ApiAttributes({
  auth,
  https,
  cors,
  status,
}: {
  auth: Auth;
  https: boolean;
  cors: Cors;
  status?: Status;
}) {
  return (
    <div className="space-y-2">
      <AttributeRow {...AUTH_ROW[auth]} />
      <AttributeRow
        label={https ? 'HTTPS available' : 'HTTPS unavailable'}
        tone={https ? 'ok' : 'no'}
      />
      <AttributeRow {...CORS_ROW[cors]} />
      {status && status !== 'unchecked' && (
        <AttributeRow
          label={status === 'live' ? 'Responding' : 'Not responding'}
          tone={status === 'live' ? 'ok' : 'no'}
        />
      )}
    </div>
  );
}

export function StatusDot({ status, health }: { status: Status; health?: { score: number } }) {
  if (status === 'unchecked') return null;
  const live = status === 'live';
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      title={
        live
          ? `Responding normally${health ? `, health ${health.score}/100` : ''}`
          : 'Failing our most recent checks'
      }
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${live ? 'bg-ok' : 'bg-no'}`}
      />
      <span className={live ? 'text-ok' : 'text-no'}>{live ? 'Live' : 'Down'}</span>
    </span>
  );
}
