/**
 * Shared shell for prose pages: about, policies, editorial standards.
 * Tailwind v4 ships no typography plugin by default, so the rhythm is set here once
 * rather than repeated as utility soup on every page.
 */
export function Prose({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
        {updated && (
          <p className="mt-4 text-xs text-muted">
            Last updated{' '}
            <time dateTime={updated}>
              {new Date(updated).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </p>
        )}
      </header>

      <div
        className="
          [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight
          [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold
          [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-strong
          [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:pl-5
          [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:pl-5
          [&_li]:list-item [&_li]:leading-relaxed [&_li]:text-muted-strong
          [&_ul]:list-disc [&_ol]:list-decimal
          [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_code]:rounded [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
          [&_table]:mb-4 [&_table]:w-full [&_table]:text-sm
          [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
          [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:py-2 [&_td]:align-top [&_td]:text-muted-strong
        "
      >
        {children}
      </div>
    </article>
  );
}

/** Marks content the site owner must replace before launch. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-unknown-bg px-1.5 py-0.5 text-unknown">
      {children}
    </mark>
  );
}
