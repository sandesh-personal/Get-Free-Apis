import type { Api } from './apis';

/**
 * The uptime proof the blueprint asks for (§5): a relative check time next to a
 * reliability figure, so a listing reads as verified rather than copied.
 *
 * One deliberate limit. The catalogue records `lastChecked` as a DATE, not a
 * timestamp, so the finest honest unit is a day. The blueprint's example wording
 * ("Checked 2 hours ago") implies hour precision this data does not have, and
 * printing an hour count would be inventing accuracy. Same-day checks therefore say
 * "today" rather than guessing a number of hours.
 *
 * If the health cron is later changed to store a full ISO timestamp, this is the only
 * place that needs to learn about hours.
 */
export function checkedAgo(lastChecked: string, now: Date = new Date()): string | null {
  if (!lastChecked) return null;

  const checked = new Date(`${lastChecked}T00:00:00Z`);
  if (Number.isNaN(checked.getTime())) return null;

  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((startOfToday - checked.getTime()) / 86_400_000);

  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 61) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * The one-line verification stamp shown on cards and on the detail page.
 *
 * Returns null when there is nothing verified to claim, so callers render nothing
 * rather than an empty or misleading badge.
 */
export function uptimeProof(
  api: Api,
  now?: Date,
): { tone: 'live' | 'down'; label: string } | null {
  // Shut down is a verified fact rather than a probe result, so it outranks health data.
  if (api.status === 'discontinued') {
    const when = api.access?.discontinuedOn;
    return { tone: 'down', label: when ? `Shut down ${formatShutdown(when)}` : 'Shut down' };
  }

  if (!api.health || api.status === 'unchecked') return null;

  const ago = checkedAgo(api.health.lastChecked, now);
  if (!ago) return null;

  if (api.status === 'down') {
    return { tone: 'down', label: `Checked ${ago}: not responding` };
  }

  return {
    tone: 'live',
    label: `Verified ${ago}: ${api.health.reliability}% uptime`,
  };
}

/** "2025-03-31" → "31 March 2025", "2022-05" → "May 2022". Unparseable input is returned as-is. */
export function formatShutdown(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month) return date;
  const value = new Date(Date.UTC(year, month - 1, day || 1));
  return value.toLocaleDateString('en-GB', {
    ...(day && { day: 'numeric' }),
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
