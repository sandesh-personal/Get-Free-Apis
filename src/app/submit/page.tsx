import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { SubmitForm } from '@/components/SubmitForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Submit an API',
  description: `Suggest a free public API for inclusion in the ${site.name} catalogue. Here is what we need and how we assess submissions.`,
  alternates: { canonical: '/submit' },
};

export default function SubmitPage() {
  return (
    <Prose
      title="Submit an API"
      intro="Know a free API we are missing? Send it over."
      updated="2026-09-18"
    >
      <SubmitForm email={site.submitEmail} />

      <h2>What we need</h2>
      <p>
        The form above collects all of it. If you would rather just write to us, send the same
        details to <a href={`mailto:${site.submitEmail}`}>{site.submitEmail}</a>:
      </p>
      <ul>
        <li>
          <strong>Name</strong> of the API
        </li>
        <li>
          <strong>Documentation URL</strong>, the page a developer should actually start on
        </li>
        <li>
          <strong>One-line description</strong>, plain and specific. What data does it return?
        </li>
        <li>
          <strong>Authentication</strong>: none, API key, OAuth, or something else
        </li>
        <li>
          <strong>Category</strong>, or your best guess at one
        </li>
      </ul>
      <p>
        We work out HTTPS, CORS and current status ourselves, so you do not need to supply those.
      </p>

      <h2>What we accept</h2>
      <p>
        The bar is simple: the API must have a meaningful free tier, public documentation, and it
        must actually respond when we check it.
      </p>
      <p>We will turn down submissions that:</p>
      <ul>
        <li>Have no free tier, or a free tier too small to build anything with</li>
        <li>Require a sales call or an approval process before you can try them</li>
        <li>Have no public documentation</li>
        <li>Do not respond to our checks</li>
        <li>Serve illegal content, or scrape a service in breach of its terms</li>
      </ul>

      <h2>Submitting your own API</h2>
      <p>
        That is fine, and you do not need to hide it. Say that it is yours so we can note it. There
        is no fee, and there is no way to pay for a listing or for better placement. Ranking is
        computed from measured properties, as described in our{' '}
        <Link href="/editorial-policy">editorial policy</Link>.
      </p>

      <h2>What happens next</h2>
      <p>
        Submissions are reviewed by hand, checked automatically, and added in the next catalogue
        build if they qualify. We will let you know either way.
      </p>

    </Prose>
  );
}
