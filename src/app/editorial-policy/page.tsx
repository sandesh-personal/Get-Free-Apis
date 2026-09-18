import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Editorial policy',
  description:
    'How GetFreeAPIs researches, tests, ranks and corrects its listings and articles, and how advertising is kept separate from editorial judgement.',
  alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <Prose
      title="Editorial policy"
      intro="How we research, test, rank and correct what appears on this site."
      updated="2026-09-18"
    >
      <h2>Our standard</h2>
      <p>
        Every factual claim on this site should be traceable to something we measured or to a
        primary source we link. Where we have not verified something, we say so rather than
        implying certainty we do not have.
      </p>

      <h2>How listings are built</h2>
      <ol>
        <li>
          <strong>Aggregate.</strong> Entries are collected from established public lists, named on
          the <Link href="/about">about page</Link>.
        </li>
        <li>
          <strong>Normalise.</strong> Authentication values, HTTPS flags and CORS values arrive in
          inconsistent formats. We map them to a single vocabulary and strip tracking parameters
          from URLs.
        </li>
        <li>
          <strong>Deduplicate.</strong> The same API often appears on several lists under slightly
          different URLs. We merge on a canonical form of the documentation URL.
        </li>
        <li>
          <strong>Verify.</strong> We send our own requests, recording status, latency, redirects
          and CORS headers.
        </li>
        <li>
          <strong>Publish.</strong> Results go on the listing with the date they were measured.
        </li>
      </ol>

      <h2>How we test</h2>
      <p>
        Checks use a real browser-style request with an identifying <code>User-Agent</code> that
        names this site. We try <code>HEAD</code> first and fall back to <code>GET</code> only when
        a server rejects it, which keeps load on providers to a minimum. Requests are rate-limited
        and time out after ten seconds.
      </p>
      <p>
        A listing is marked as failing when it does not respond successfully to our checks. That is
        a statement about what we observed, not a judgement about the provider. Transient outages
        happen, which is why the measurement date is always shown and why we re-check on a
        schedule.
      </p>

      <h2>How things are ranked</h2>
      <p>
        Ordering is computed, not sold. Where we sort by quality we favour listings that respond
        reliably, need no API key, support CORS and run over HTTPS, because those are the
        properties that determine whether someone can actually use an API today. No provider can
        pay for placement, and no ranking factor is influenced by advertising.
      </p>

      <h2>Articles</h2>
      <p>Anything published in our articles section must meet all of the following:</p>
      <ul>
        <li>Written by a named author with a visible byline and biography</li>
        <li>Based on APIs we have actually called, with the test date stated</li>
        <li>Carrying at least one original measurement, diagram or screenshot</li>
        <li>Linking to primary sources rather than to other summaries</li>
        <li>Showing both a published date and a last-updated date</li>
      </ul>
      <p>
        We use software tooling in our research and drafting, as most publishers now do. Every
        article is reviewed and fact-checked by a person before publication, and the named author
        is accountable for it. We do not publish anything we have not verified.
      </p>

      <h2>Corrections</h2>
      <p>
        If we get something wrong we fix it, and if the correction is material we note it at the
        foot of the page with the date. We do not quietly rewrite history. Report an error through
        the <Link href="/contact">contact page</Link> and we will respond.
      </p>

      <h2>Advertising and independence</h2>
      <p>
        {site.name} is funded by advertising. Advertisers have no input into which APIs are listed,
        how they are described, how they rank, or what our checks report. Any commercial
        relationship that could reasonably be seen to affect coverage will be disclosed on the
        page where it applies. See the <Link href="/disclaimer">disclaimer</Link> for details.
      </p>

      <h2>Removal requests</h2>
      <p>
        If you operate an API listed here and would like the listing amended or removed, contact
        us and we will action reasonable requests. We link to public documentation and describe
        publicly advertised functionality, but we would rather work with providers than against
        them.
      </p>
    </Prose>
  );
}
