import type { Auth, Cors, Status } from '@/lib/apis';

type Tone = 'ok' | 'key' | 'oauth' | 'no' | 'unknown' | 'neutral';

const TONE: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok',
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
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

const AUTH_LABEL: Record<Auth, { label: string; tone: Tone; title: string }> = {
  none: { label: 'No key', tone: 'ok', title: 'No authentication required' },
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
