import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllApis, stats } from '@/lib/apis';
import { StatusDot } from '@/components/Badge';

export const metadata: Metadata = {
  title: 'Live API status',
  description:
    'Which free public APIs are responding right now, which have stopped, and how fast the healthy ones reply. Measured by us, not self-reported.',
  alternates: { canonical: '/status' },
};

export default function StatusPage() {
  const checked = getAllApis().filter((a) => a.health);
  const live = checked.filter((a) => a.status === 'live');
  const down = checked.filter((a) => a.status === 'down');

  const fastest = [...live]
    .sort((a, b) => (a.health!.latencyMs || Infinity) - (b.health!.latencyMs || Infinity))
    .slice(0, 10);

  const slowest = [...live]
    .sort((a, b) => b.health!.latencyMs - a.health!.latencyMs)
    .slice(0, 10);

  const uptime = checked.length ? Math.round((live.length / checked.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">API status</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Most directories never check whether the APIs they list still work. We do, and we publish
          the failures alongside the successes. These numbers come from our own requests, not from
          anything the providers report about themselves.
        </p>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-4">
        <Stat label="Checked" value={checked.length.toLocaleString('en-GB')} />
        <Stat label="Responding" value={live.length.toLocaleString('en-GB')} tone="ok" />
        <Stat label="Failing" value={down.length.toLocaleString('en-GB')} tone="no" />
        <Stat label="Healthy share" value={`${uptime}%`} />
      </section>

      {checked.length < stats.total && (
        <p className="mb-10 rounded-lg border border-border-subtle bg-surface p-4 text-sm leading-relaxed text-muted">
          {(stats.total - checked.length).toLocaleString('en-GB')} of{' '}
          {stats.total.toLocaleString('en-GB')} listings are still awaiting their first check. We
          show them as unverified rather than implying a status we have not measured.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Table title="Fastest responses" apis={fastest} />
        <Table title="Slowest responses" apis={slowest} />
      </div>

      {down.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Currently failing</h2>
          <p className="mb-4 text-sm text-muted">
            These are listed so you do not waste time on them. We keep the page rather than delete
            it, because a dead API is still a useful search result.
          </p>
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-border-subtle">
            {down.slice(0, 25).map((api) => (
              <li key={api.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link href={`/apis/${api.id}`} className="min-w-0 text-sm font-medium hover:text-accent">
                  <span className="block truncate">{api.name}</span>
                  <span className="block truncate text-xs font-normal text-muted">{api.category}</span>
                </Link>
                <StatusDot status={api.status} health={api.health} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'no' }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === 'ok' ? 'text-ok' : tone === 'no' ? 'text-no' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Table({ title, apis }: { title: string; apis: ReturnType<typeof getAllApis> }) {
  if (apis.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-border-subtle">
        {apis.map((api) => (
          <li key={api.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <Link href={`/apis/${api.id}`} className="min-w-0 truncate text-sm hover:text-accent">
              {api.name}
            </Link>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {api.health!.latencyMs} ms
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
