import Link from 'next/link';
import type { Api } from '@/lib/apis';
import { buildSnippets } from '@/lib/snippets';
import { uptimeProof } from '@/lib/uptime';
import { AuthBadge, CorsBadge, HttpsBadge } from './Badge';
import { CopyCurl } from './CopyCurl';

/**
 * Card layout follows the blueprint's component standard (§2): name, category pill,
 * a two-line description clamp, auth badges, the uptime proof, then the actions.
 *
 * The whole card is no longer one big link. It contains its own buttons now, and a
 * button inside an anchor is invalid and unreliable for keyboard users, so the title
 * carries the link and a stretched pseudo-element makes the rest of the card
 * clickable. The action row sits above that overlay so its own clicks still land.
 */
export function ApiCard({ api }: { api: Api }) {
  const proof = uptimeProof(api);
  const curl = api.url ? buildSnippets(api).find((s) => s.id === 'curl')?.code : undefined;

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-sm transition hover:border-accent hover:shadow-md focus-within:border-accent">
      <h3 className="type-card-title text-foreground">
        <Link
          href={`/apis/${api.id}`}
          className="outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-accent"
        >
          {api.name}
        </Link>
      </h3>

      <p className="mt-1.5">
        <span className="type-badge-sm inline-flex rounded-md bg-surface px-2 py-0.5 uppercase tracking-wide text-muted-strong">
          {api.category}
        </span>
      </p>

      {/* Two lines exactly, so every card in a row ends at the same place. */}
      <p className="type-card-body mt-2.5 line-clamp-2 text-muted">{api.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <AuthBadge auth={api.auth} />
        {api.cors === 'yes' && <CorsBadge cors={api.cors} />}
        {api.https && <HttpsBadge https={api.https} />}
      </div>

      {/* Pushed to the bottom so the action row lines up across a row of cards. */}
      <div className="mt-auto pt-4">
        {proof && (
          <p className="type-meta mb-3 flex items-center gap-1.5 text-muted">
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full ${
                proof.tone === 'live' ? 'bg-ok' : 'bg-no'
              }`}
            />
            {proof.label}
          </p>
        )}

        <div className="relative z-10 flex items-center gap-2">
          {/*
            A second link to the same page as the title. Kept focusable rather than
            hidden from the tab order: it is visible, so a keyboard user must be able
            to reach it. The accessible name is qualified so a screen-reader user
            hearing it out of context knows which listing it opens.
          */}
          <Link
            href={`/apis/${api.id}`}
            aria-label={`View details for ${api.name}`}
            className="type-badge rounded-lg bg-accent px-3 py-1.5 text-accent-on transition hover:bg-accent-hover"
          >
            View Details
          </Link>
          {curl && <CopyCurl curl={curl} name={api.name} />}
        </div>
      </div>
    </article>
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
