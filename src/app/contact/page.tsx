import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose, Todo } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Report an incorrect listing, request a correction or removal, or get in touch with the team behind ${site.name}.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <Prose
      title="Contact"
      intro="Corrections, removals, suggestions and everything else."
      updated="2026-09-18"
    >
      <h2>Get in touch</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a> and we will reply. It reaches
        Sandy directly, because there is nobody else. Corrections to a listing are prioritised
        over everything else.
      </p>
      <p>
        <Todo>
          Set up a real mailbox on the domain before launch. A working contact route is an
          eligibility requirement for most ad networks, and a generic free-mail address weakens
          the trust signal.
        </Todo>
      </p>

      <h2>Reporting an incorrect listing</h2>
      <p>To get a fix made quickly, include:</p>
      <ul>
        <li>The listing URL on this site</li>
        <li>What is wrong, specifically</li>
        <li>What the correct information is, with a link to the official documentation</li>
      </ul>

      <h2>If you run an API we list</h2>
      <p>
        We are happy to correct anything inaccurate, update a description you would like worded
        differently, or remove a listing entirely on request. If our checks are marking your API as
        failing and you believe that is wrong, tell us how you would prefer to be probed and we
        will adjust. Our checks identify themselves in the <code>User-Agent</code> header.
      </p>

      <h2>Suggesting an API</h2>
      <p>
        Use the <Link href="/submit">submission page</Link> instead, which captures everything we
        need in one go.
      </p>

      <h2>Press and partnerships</h2>
      <p>
        Same address. Note that we do not sell listings or ranking placement, as set out in our{' '}
        <Link href="/editorial-policy">editorial policy</Link>.
      </p>
    </Prose>
  );
}
