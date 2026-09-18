import Link from 'next/link';
import type { Api } from '@/lib/apis';
import { AuthBadge, CorsBadge, HttpsBadge, StatusDot } from './Badge';

/**
 * Card layout follows the reference design that inspired this site: rounded surface,
 * bold title, muted description, and the three scannable Auth/HTTPS/CORS badges.
 *
 * One deliberate change: the card links to our own detail page rather than straight
 * off-site. The reference bounced every visitor away on first click.
 */
export function ApiCard({ api }: { api: Api }) {
  return (
    <Link
      href={`/apis/${api.id}`}
      className="group flex h-full flex-col rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-sm transition hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold leading-tight text-foreground group-hover:text-accent">
          {api.emoji && (
            <span aria-hidden className="text-base">
              {api.emoji}
            </span>
          )}
          <span className="line-clamp-2">{api.name}</span>
        </h3>
        <StatusDot status={api.status} health={api.health} />
      </div>

      <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {api.description}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <AuthBadge auth={api.auth} />
        <HttpsBadge https={api.https} />
        <CorsBadge cors={api.cors} />
      </div>
    </Link>
  );
}

export function ApiCardGrid({ apis }: { apis: Api[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apis.map((api) => (
        <ApiCard key={api.id} api={api} />
      ))}
    </div>
  );
}
