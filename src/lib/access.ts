import type { Access, Api } from '@/lib/apis';
import { formatShutdown } from '@/lib/uptime';

export const PRICING_LABEL: Record<Access['pricing'], string> = {
  free: 'Free',
  'free-tier': 'Free tier, paid above it',
  restricted: 'Restricted',
  application: 'By application',
  paid: 'Paid',
  discontinued: 'Shut down',
};

export const KEY_LABEL: Record<Access['key'], string> = {
  none: 'Not required',
  optional: 'Optional, free',
  free: 'Required, free signup',
  application: 'By application',
  paid: 'Paid plans only',
  closed: 'No new keys issued',
};

/**
 * The detail-page <title>, written for what people actually search.
 *
 * Search Console shows these pages being found for "<name> api key" and
 * "<name> free api", then not clicked, because every title used to say "Free
 * <category> API" whether or not that was true. Verified entries now lead with
 * the answer; unverified keyed APIs drop the "free" claim we cannot back up.
 * The layout appends " | GetFreeAPIs".
 */
export function apiTitle(api: Api): string {
  const { name } = api;
  const a = api.access;

  if (api.status === 'discontinued') {
    const when = a?.discontinuedOn ? ` (${formatShutdown(a.discontinuedOn).replace(/^\d+ /, '')})` : '';
    return `${name} API Shut Down${when}: Alternatives`;
  }

  if (a) {
    switch (a.key) {
      case 'none':
        return `${name} API: Free, No API Key Needed — Limits`;
      case 'optional':
        return `${name} API Key: Free & Optional — How to Get One`;
      case 'free':
        return a.pricing === 'free'
          ? `${name} API Key: Free — How to Get One & Limits`
          : a.pricing === 'free-tier'
            ? `${name} API Key: Free Tier Limits & How to Get One`
            : `${name} API Key: Current Limits & How to Get One`;
      case 'application':
        return `${name} API Key: How to Apply & Is It Free?`;
      case 'paid':
        return `${name} API: Pricing & API Key — Is It Free?`;
      case 'closed':
        return a.alternatives?.length
          ? `${name} API: Closed to New Keys — Status & Alternatives`
          : `${name} API: Closed to New Keys — Current Status`;
    }
  }

  switch (api.auth) {
    case 'none':
      return `${name} API — Free ${api.category} API [No Key]`;
    case 'apiKey':
      return `${name} API — ${api.category} API Key, Docs & Status`;
    case 'oauth':
      return `${name} API — OAuth Setup, Docs & Status`;
    default:
      return `${name} API — Authentication, Docs & Status`;
  }
}

/** Meta description: the verified answer when we have one, the listing facts when we do not. */
export function apiDescription(api: Api): string {
  const a = api.access;
  const text = a
    ? [a.summary, a.freeLimits, `Verified ${a.verified}.`].filter(Boolean).join(' ')
    : `${sentence(api.description, 110)} ${
        api.auth === 'none' ? 'No API key required.' : 'Requires authentication.'
      } Current status, CORS and HTTPS details, checked by us.`;
  return clip(text, 158);
}

/**
 * The upstream description as one complete sentence of at most `limit` characters.
 * Slicing mid-sentence used to produce "…Start using No API key required.", and a
 * description with no full stop ran straight into the next clause.
 */
function sentence(text: string, limit: number): string {
  const trimmed = text.trim();
  const firstStop = trimmed.search(/[.!?](\s|$)/);
  if (firstStop !== -1 && firstStop < limit) return trimmed.slice(0, firstStop + 1);
  const cut = trimmed.length <= limit ? trimmed : trimmed.slice(0, trimmed.lastIndexOf(' ', limit));
  return `${cut.replace(/[,;:\s]+$/, '')}.`;
}

function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '')}…`;
}
