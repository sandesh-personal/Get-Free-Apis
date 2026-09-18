import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose, Todo } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: `The terms that govern your use of ${site.name}, including accuracy, third-party APIs, intellectual property and liability.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <Prose
      title="Terms of use"
      intro={`The terms that apply when you use ${site.domain}.`}
      updated="2026-09-18"
    >
      <p>
        <Todo>Template. Have it reviewed for your jurisdiction before launch.</Todo>
      </p>

      <h2>Acceptance</h2>
      <p>
        By using {site.domain} you accept these terms. If you do not accept them, please do not use
        the site.
      </p>

      <h2>What this site is</h2>
      <p>
        {site.name} is an index of publicly documented APIs operated by third parties. We do not
        operate, host, own or control any of the APIs listed here. We are a directory and a source
        of commentary, nothing more.
      </p>

      <h2>Accuracy</h2>
      <p>
        We work hard to keep listings correct and we verify them automatically, but the information
        is provided as-is. APIs change without notice: endpoints move, free tiers become paid,
        rate limits change, services shut down. Always check the provider&rsquo;s own documentation
        and terms before building anything on an API you found here.
      </p>
      <p>
        Status information reflects what our automated checks observed at the stated time. It is
        not a service-level guarantee and should not be relied on as one.
      </p>

      <h2>Third-party APIs</h2>
      <p>
        Your use of any listed API is governed by that provider&rsquo;s own terms, not ours. You are
        responsible for complying with them, including any licensing, attribution, rate limiting or
        commercial-use restrictions they impose. A listing here is not permission to use anything.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape the site at a rate that degrades it for others</li>
        <li>Attempt to gain unauthorised access to any part of the site or its infrastructure</li>
        <li>Use the site to break the law or to infringe anyone&rsquo;s rights</li>
        <li>Misrepresent our verification data, for example by stripping the measurement date</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The site&rsquo;s design, written articles and original research are ours. API names,
        trademarks and documentation belong to their respective owners, and appear here for
        identification and reference. Underlying catalogue data is aggregated from public sources
        credited on the <Link href="/about">about page</Link>, under their own licences.
      </p>

      <h2>Liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any loss or damage arising
        from your use of this site or of any API listed on it, including losses caused by
        inaccurate listings, downtime, or changes made by a provider. Nothing in these terms
        excludes liability that cannot lawfully be excluded.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top of the page shows when they last changed.
        Continuing to use the site after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms go through the <Link href="/contact">contact page</Link>.
      </p>
    </Prose>
  );
}
