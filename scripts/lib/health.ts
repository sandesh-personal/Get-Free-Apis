/**
 * Statuses that prove a server is up even though it refused our request.
 *
 * 401 means "send a key", 403 is usually a bot wall (Cloudflare, Akamai, AWS WAF)
 * turning away an automated client, and 429 is a rate limit. All three come from a
 * running service. Counting them as "down" marked Semantic Scholar, Pexels and
 * SecurityTrails as failing while every browser could reach them.
 */
export const REACHABLE_STATUSES = new Set([401, 403, 429]);

export function isUp(result: { ok: boolean; httpStatus?: number | null }): boolean {
  return result.ok || (typeof result.httpStatus === 'number' && REACHABLE_STATUSES.has(result.httpStatus));
}
