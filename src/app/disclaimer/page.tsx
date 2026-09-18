import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: `How ${site.name} is funded, how advertising is kept separate from editorial judgement, and the limits of the information published here.`,
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <Prose
      title="Disclaimer"
      intro="How this site is funded and what that does, and does not, affect."
      updated="2026-09-18"
    >
      <h2>Advertising</h2>
      <p>
        {site.name} carries advertising. Ads are served by third-party networks and are clearly
        distinguishable from our own content. We do not choose individual advertisers, and their
        appearance here is not an endorsement.
      </p>
      <p>
        Advertising revenue has no influence on which APIs are listed, how they are described, how
        they rank, or what our automated checks report. Ranking is computed from measured
        properties, as set out in our <Link href="/editorial-policy">editorial policy</Link>. No
        provider can pay for a listing or for placement.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some outbound links may be affiliate links, meaning we could earn a commission if you sign
        up for a paid service. Where that is the case it will be disclosed on the page itself.
        Affiliate arrangements never affect whether an API is listed or how it is assessed, and we
        will not recommend something we would not recommend unpaid.
      </p>

      <h2>No professional advice</h2>
      <p>
        Everything here is general technical information for developers. It is not legal, security
        or financial advice. Before depending on any API in production, read the
        provider&rsquo;s own terms, check their licensing, and satisfy yourself that it meets your
        requirements.
      </p>

      <h2>Accuracy and availability</h2>
      <p>
        Status and performance figures describe what our checks observed at a stated moment. They
        are measurements, not guarantees, and they can be wrong: a provider may block automated
        requests, or be briefly down when we happen to check. We publish the measurement date on
        every listing so you can judge how current it is.
      </p>
      <p>
        Free tiers change. An API that needs no key today may require one next month. Always
        confirm against the provider&rsquo;s documentation.
      </p>

      <h2>External sites</h2>
      <p>
        We link to third-party documentation throughout. We do not control those sites and are not
        responsible for their content, their accuracy, or what they do with your data.
      </p>

      <h2>Corrections</h2>
      <p>
        If something here is wrong, tell us through the <Link href="/contact">contact page</Link>{' '}
        and we will correct it.
      </p>
    </Prose>
  );
}
