import { ApiCard } from '@/components/ApiCard';
import { getApi, type Api } from '@/lib/apis';
import { KEY_LABEL, PRICING_LABEL } from '@/lib/access';
import { formatShutdown } from '@/lib/uptime';

/**
 * The verified "is it free, and how do I get a key?" answer.
 *
 * This is what the people landing on these pages searched for, so it sits above the
 * probe data. Everything in it comes from data/access.json, which is written by hand
 * from the provider's own pages and our own calls, with the check date shown.
 */
export function AccessPanel({ api }: { api: Api }) {
  const a = api.access;
  if (!a) return null;

  const discontinued = api.status === 'discontinued';

  return (
    <section
      id="access"
      className={`mb-10 rounded-xl border p-5 ${
        discontinued ? 'border-no bg-no-bg' : 'border-border-subtle bg-surface-raised'
      }`}
    >
      <h2 className="text-xl font-bold tracking-tight">
        {discontinued
          ? `${api.name} has been shut down`
          : `Is ${api.name} free, and does it need an API key?`}
      </h2>
      <p className="mt-3 max-w-3xl leading-relaxed">{a.summary}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <Row label="Price" value={PRICING_LABEL[a.pricing]} />
        <Row label="API key" value={KEY_LABEL[a.key]} />
        {a.discontinuedOn && <Row label="Shut down" value={formatShutdown(a.discontinuedOn)} />}
        {a.freeLimits && <Row label="Free limits" value={a.freeLimits} wide />}
        {a.paidFrom && <Row label="Cheapest paid plan" value={a.paidFrom} wide />}
      </dl>

      {!discontinued && a.keySteps && a.keySteps.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">How to get {aOrAn(api.name)} {api.name} API key</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {a.keySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {a.keyUrl && (
              <a
                href={a.keyUrl}
                target="_blank"
                rel="noreferrer nofollow"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
              >
                {a.key === 'application' ? 'Apply for access ↗' : 'Get a key ↗'}
              </a>
            )}
            {a.keyUsage && (
              <p className="text-sm text-muted">
                Send it as{' '}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-foreground">{a.keyUsage}</code>
              </p>
            )}
          </div>
        </div>
      )}

      {!a.keySteps && a.keyUsage && !discontinued && (
        <p className="mt-5 text-sm text-muted">
          Call it with{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-foreground">{a.keyUsage}</code>
        </p>
      )}

      <Alternatives ids={a.alternatives} name={api.name} />

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Checked by hand on {a.verified} against{' '}
        {a.sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && (i === a.sources.length - 1 ? ' and ' : ', ')}
            <a href={source.url} target="_blank" rel="noreferrer nofollow" className="underline hover:text-accent">
              {source.label}
            </a>
          </span>
        ))}
        . Providers change their terms, so confirm on their own pages before you commit.
      </p>
    </section>
  );
}

function Alternatives({ ids, name }: { ids?: string[]; name: string }) {
  const apis = (ids ?? []).map(getApi).filter((a): a is Api => Boolean(a));
  if (apis.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="mb-3 font-semibold">Use one of these instead of {name}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apis.map((alt) => (
          <ApiCard key={alt.id} api={alt} />
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-border-subtle bg-surface p-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium leading-relaxed">{value}</dd>
    </div>
  );
}

function aOrAn(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
