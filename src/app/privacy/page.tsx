import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose, Todo } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${site.name} handles personal data, cookies, analytics and advertising, and what choices you have.`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy policy"
      intro={`How ${site.name} handles your data, what we collect, and what we do not.`}
      updated="2026-09-18"
    >
      <p>
        <Todo>
          Have this reviewed against your jurisdiction before you launch or apply to an ad
          network. The operator and contact details below are filled in; the legal wording is
          not a substitute for advice.
        </Todo>
      </p>

      <h2>Who we are</h2>
      <p>
        This site is {site.domain}, run by Sandy, an independent developer operating as a sole
        trader. There is no company and no business premises, so no postal address is published.
        For any privacy question &mdash; including a request to access or delete data we hold
        about you &mdash; email{' '}
        <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>, and we will respond
        within 30 days.
      </p>

      <h2>What we collect</h2>
      <p>
        We do not ask you to create an account and we do not collect names, email addresses or
        payment details through normal use of the site. What is collected falls into three groups:
      </p>
      <ul>
        <li>
          <strong>Analytics.</strong> Aggregated, privacy-focused measurement of which pages are
          visited and roughly where visitors come from. It is not used to identify individuals and
          is not sold or shared.
        </li>
        <li>
          <strong>Advertising.</strong> Our advertising partners may set cookies or similar
          identifiers. See the advertising section below.
        </li>
        <li>
          <strong>Server logs.</strong> Our hosting provider records standard request data,
          including IP address and user agent, for security and reliability. These are retained
          only as long as needed for those purposes.
        </li>
      </ul>
      <p>
        If you contact us, we keep your message and contact details for as long as it takes to deal
        with the matter.
      </p>

      <h2>Cookies</h2>
      <p>
        Your theme preference is stored in your browser so the site remembers whether you chose
        light or dark. That value never leaves your device.
      </p>
      <p>
        Advertising and analytics may set additional cookies. Where the law requires consent, you
        will be asked before any non-essential cookie is set, and you can change your choice at any
        time.
      </p>

      <h2>Advertising</h2>
      <p>
        We display advertising to fund the site. Third-party vendors, including Google, use cookies
        to serve ads based on your prior visits to this and other websites.
      </p>
      <p>
        Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you
        based on your visit to this site and other sites on the internet. You can opt out of
        personalised advertising by visiting{' '}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
          Google Ads Settings
        </a>
        . You can also opt out of third-party vendor cookies at{' '}
        <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
          aboutads.info
        </a>
        .
      </p>

      <h2>External links</h2>
      <p>
        Nearly every listing links to documentation on a site we do not control. Once you follow
        one of those links, that site&rsquo;s privacy policy applies, not ours. We have no influence
        over what they collect.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access the personal data we hold
        about you, to have it corrected or deleted, to object to processing, or to withdraw
        consent. Contact us and we will respond within the period the applicable law allows.
      </p>

      <h2>Children</h2>
      <p>
        This site is aimed at software developers and is not directed at children under 13. We do
        not knowingly collect personal data from children.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, the date at the top of this page will be updated. Please
        check back occasionally. Questions go to the{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </Prose>
  );
}
