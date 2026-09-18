import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';
import { getApi } from '@/lib/apis';

/**
 * Components available inside posts.
 *
 * `Tested` and `Measured` exist to satisfy the rule that every article must carry at
 * least one piece of data that exists nowhere else. They force an explicit date onto
 * any claim about how an API behaves, which is the difference between first-hand
 * reporting and a rewrite of someone else's blog post.
 */

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: 'note' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    note: { border: 'border-key', bg: 'bg-key-bg', text: 'text-key', icon: 'ℹ️', label: 'Note' },
    tip: { border: 'border-ok', bg: 'bg-ok-bg', text: 'text-ok', icon: '✅', label: 'Tip' },
    warning: {
      border: 'border-unknown',
      bg: 'bg-unknown-bg',
      text: 'text-unknown',
      icon: '⚠️',
      label: 'Watch out',
    },
    danger: { border: 'border-no', bg: 'bg-no-bg', text: 'text-no', icon: '🛑', label: 'Careful' },
  }[type];

  return (
    <aside className={`my-6 rounded-xl border-l-4 ${styles.border} ${styles.bg} p-4`}>
      <p className={`mb-1 flex items-center gap-2 text-sm font-semibold ${styles.text}`}>
        <span aria-hidden>{styles.icon}</span>
        {title ?? styles.label}
      </p>
      <div className="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}

/** A claim backed by a request we actually made, with the date we made it. */
export function Tested({
  date,
  endpoint,
  result,
  children,
}: {
  date: string;
  endpoint?: string;
  result?: string;
  children?: React.ReactNode;
}) {
  return (
    <aside className="my-6 rounded-xl border border-border-strong bg-surface p-4">
      <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
        <span aria-hidden>🔬</span>
        We tested this
        <time dateTime={date} className="font-normal normal-case tracking-normal text-muted">
          on {date}
        </time>
      </p>
      {endpoint && (
        <p className="mb-2 overflow-x-auto font-mono text-xs text-muted-strong">{endpoint}</p>
      )}
      {result && <p className="mb-2 text-sm font-medium">{result}</p>}
      {children && <div className="text-sm leading-relaxed text-muted-strong">{children}</div>}
    </aside>
  );
}

/** A figure from our own measurements. */
export function Measured({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <span className="mx-0.5 inline-flex items-baseline gap-1.5 rounded-lg bg-accent-soft px-2 py-0.5">
      <strong className="text-accent">{value}</strong>
      <span className="text-xs text-muted-strong">{label}</span>
      {note && <span className="text-xs text-muted">({note})</span>}
    </span>
  );
}

/** Inline reference to a catalogue entry, so posts link down into the directory. */
export function ApiRef({ id, children }: { id: string; children?: React.ReactNode }) {
  const api = getApi(id);
  if (!api) return <span>{children ?? id}</span>;

  return (
    <Link
      href={`/apis/${api.id}`}
      className="font-medium text-accent underline underline-offset-2"
      title={api.description}
    >
      {children ?? api.name}
    </Link>
  );
}

/** Table of catalogue entries with their live status. Data comes from our checks. */
export function ApiTable({ ids = [] }: { ids?: string[] }) {
  const rows = ids.map((id) => getApi(id)).filter((a): a is NonNullable<typeof a> => Boolean(a));
  if (rows.length === 0) return null;

  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full min-w-125 text-sm">
        <thead className="bg-surface text-left">
          <tr>
            <th className="px-4 py-2.5 font-semibold">API</th>
            <th className="px-4 py-2.5 font-semibold">Key needed</th>
            <th className="px-4 py-2.5 font-semibold">CORS</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((api) => (
            <tr key={api.id} className="border-t border-[var(--border)]">
              <td className="px-4 py-2.5">
                <Link href={`/apis/${api.id}`} className="font-medium text-accent hover:underline">
                  {api.name}
                </Link>
                <span className="block text-xs text-muted">{api.description.slice(0, 70)}</span>
              </td>
              <td className="px-4 py-2.5">{api.auth === 'none' ? 'No' : 'Yes'}</td>
              <td className="px-4 py-2.5">
                {api.cors === 'yes' ? 'Yes' : api.cors === 'no' ? 'No' : 'Unknown'}
              </td>
              <td className="px-4 py-2.5">
                {api.status === 'live' ? (
                  <span className="text-ok">Live</span>
                ) : api.status === 'down' ? (
                  <span className="text-no">Failing</span>
                ) : (
                  <span className="text-muted">Unchecked</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The answer, stated immediately, for readers and for featured snippets. */
export function Answer({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl border border-accent bg-accent-soft p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Short answer</p>
      <div className="leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}

export function Figure({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface p-4">
        {children}
      </div>
      <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  Tested,
  Measured,
  ApiRef,
  ApiTable,
  Answer,
  Figure,
  a: ({ href, children, ...props }) => {
    const url = String(href ?? '');
    if (url.startsWith('/')) {
      return (
        <Link href={url} className="text-accent underline underline-offset-2">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-accent underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    );
  },
};
