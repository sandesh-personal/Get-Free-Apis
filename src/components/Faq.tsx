import type { Faq as FaqItem } from '@/lib/blog';

/**
 * Shared question-and-answer block.
 *
 * Every FAQ on this site is generated from the page's own data rather than from a
 * shared boilerplate list, so each block is unique to the page it sits on. That
 * matters twice over: identical FAQs repeated site-wide read as thin content, and
 * duplicated FAQPage markup across hundreds of pages is exactly the pattern search
 * engines treat as manipulation.
 *
 * `schema` is therefore opt-out, for the rare page whose questions restate another
 * page's rather than answering something new.
 *
 * Markup note: these are <details> rather than a <dl>, because a disclosure widget
 * is what this behaves like and <details> is not valid inside a <dl>. The first two
 * are open by default so the answers are visible to a reader who never clicks.
 */
export function Faq({
  items,
  heading = 'Common questions',
  id = 'faq',
  schema = true,
  intro,
  openCount = 2,
}: {
  items: FaqItem[];
  heading?: string;
  id?: string;
  schema?: boolean;
  intro?: string;
  openCount?: number;
}) {
  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section id={id} className="mt-12 border-t border-border-subtle pt-8">
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
      {intro && <p className="mt-1.5 text-sm text-muted">{intro}</p>}

      <div className="mt-5 space-y-3">
        {items.map((item, i) => (
          <details
            key={item.q}
            open={i < openCount}
            className="group rounded-xl border border-border-subtle bg-surface-raised p-5 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold marker:content-none">
              <h3 className="text-base font-semibold">{item.q}</h3>
              <span
                aria-hidden
                className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-45"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-strong">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
