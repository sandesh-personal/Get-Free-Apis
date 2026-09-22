import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq } from '@/components/Faq';
import { apiFaq, siteFaq } from '@/lib/faq';
import { getAllCategories, getApi, stats } from '@/lib/apis';
import { CLUSTERS, getAllPosts } from '@/lib/blog';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free API FAQ — Keys, CORS and Licensing',
  description: `How ${site.name} checks APIs, what "no API key" and CORS actually mean, and where the catalogue data comes from. Answers to the questions we get most.`,
  alternates: { canonical: '/faq' },
};

/**
 * The site-wide FAQ. Page-specific questions live on the pages they belong to,
 * generated from that page's data — see src/lib/faq.ts. This page answers the
 * questions about the project itself, and then points at those.
 */
export default function FaqPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  // A worked example, so the "every listing has its own answers" claim is visible
  // rather than asserted. Falls back if the catalogue no longer holds this entry.
  const example = getApi('open-meteo-ensemble') ?? getApi('zippopotam-us');

  const postsWithFaq = posts.filter((p) => p.faq.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span>FAQ</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        How the catalogue is built and checked, what the badges mean, and what you are
        allowed to do with any of it.
      </p>

      <Faq items={siteFaq()} heading="About this site" id="about-the-site" />

      {example && (
        <section className="mt-12 border-t border-border-subtle pt-8">
          <h2 className="text-2xl font-bold tracking-tight">Questions about a specific API</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Every one of the {stats.total.toLocaleString('en-GB')} listings answers its own
            set, generated from what our checks actually found rather than from a template.
            These are the questions {example.name} answers on{' '}
            <Link href={`/apis/${example.id}`} className="text-accent hover:underline">
              its page
            </Link>
            :
          </p>

          <ul className="mt-4 space-y-2">
            {apiFaq(example).map((item) => (
              <li key={item.q} className="text-sm">
                <Link href={`/apis/${example.id}#faq`} className="text-accent hover:underline">
                  {item.q}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 border-t border-border-subtle pt-8">
        <h2 className="text-2xl font-bold tracking-tight">Questions answered in our articles</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {postsWithFaq.length} articles each answer a handful of questions in depth. Browse by
          what you are trying to do.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.values(CLUSTERS).map((cluster) => {
            const count = posts.filter((p) => p.cluster === cluster.slug).length;
            return (
              <Link
                key={cluster.slug}
                href={`/blog/category/${cluster.slug}`}
                className="group rounded-xl border border-border-subtle bg-surface-raised p-4 transition hover:border-accent"
              >
                <p className="font-semibold group-hover:text-accent">
                  {cluster.name}
                </p>
                <p className="mt-1 text-sm text-muted">{count} articles</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-border-subtle pt-8">
        <h2 className="text-2xl font-bold tracking-tight">Looking for a specific kind of API?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Each of the {categories.length} category pages answers how many APIs it holds, how
          many need no key, and which responded fastest at our last check.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.slice(0, 14).map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}#faq`}
              className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 text-sm transition hover:border-accent hover:text-accent"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/categories"
            className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-accent hover:underline"
          >
            All {categories.length} categories →
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="text-lg font-semibold">Still not answered?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-strong">
          If something here is wrong, out of date, or missing, tell us and we will fix the
          entry. Corrections are the whole point of checking things ourselves.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
          >
            Contact us
          </Link>
          <Link
            href="/submit"
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            Submit an API
          </Link>
          <Link
            href="/editorial-policy"
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            Editorial policy
          </Link>
        </div>
      </section>
    </div>
  );
}
