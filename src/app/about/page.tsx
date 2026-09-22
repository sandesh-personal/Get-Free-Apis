import Link from 'next/link';
import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { stats } from '@/lib/apis';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who runs GetFreeAPIs, where the catalogue comes from, how listings are verified, and why we publish the failures alongside the successes.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <Prose
      title={`About ${site.name}`}
      intro="A directory of free public APIs that is actually checked, by people who got tired of clicking through to 404 pages."
      updated="2026-09-18"
    >
      <h2>Why this site exists</h2>
      <p>
        Nearly every free API directory on the web is a copy of the same community-maintained
        list. Those copies are made once and then left alone. Links rot, providers shut down,
        free tiers quietly become paid, and the directory keeps cheerfully listing them for
        years. Finding a working free API becomes a game of clicking until something responds.
      </p>
      <p>
        We built <strong>{site.name}</strong> to fix the specific part of that problem that is
        actually fixable: <strong>we check</strong>. Every listing gets probed automatically, and
        we publish what we find, including the failures. A dead API marked dead is more useful
        than a dead API marked nothing at all.
      </p>

      <h2>What we do differently</h2>
      <ul>
        <li>
          <strong>We verify listings.</strong> Requests go out to every entry in the catalogue and
          we record the status, the response time and the redirect chain. Those results appear on
          the listing and on our <Link href="/status">status page</Link>.
        </li>
        <li>
          <strong>We measure CORS ourselves.</strong> Upstream lists mark most entries as unknown.
          We send a real request with an <code>Origin</code> header and read the answer off the
          response, which tells you whether the API will work from browser JavaScript.
        </li>
        <li>
          <strong>We give every API its own page.</strong> Most directories are a wall of cards
          that bounce you straight off-site. We would rather answer the question first.
        </li>
        <li>
          <strong>We say when we do not know.</strong> Entries we have not yet checked are marked
          unverified rather than being given a status we have not measured.
        </li>
      </ul>

      <h2>Where the data comes from</h2>
      <p>
        The catalogue is assembled from three public sources, then normalised, deduplicated and
        checked independently:
      </p>
      <ul>
        <li>
          <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noreferrer">
            public-apis/public-apis
          </a>{' '}
          — the largest community-maintained list
        </li>
        <li>
          <a href="https://github.com/public-api-lists/public-api-lists" target="_blank" rel="noreferrer">
            public-api-lists
          </a>{' '}
          — an actively maintained fork with cleaner entries
        </li>
        <li>
          <a href="https://www.freepublicapis.com/" target="_blank" rel="noreferrer">
            freepublicapis.com
          </a>{' '}
          — contributes reliability and latency measurements
        </li>
      </ul>
      <p>
        Those three overlap heavily. After deduplicating on the canonical documentation URL we are
        left with <strong>{stats.total.toLocaleString('en-GB')}</strong> unique APIs across{' '}
        <strong>{stats.categories}</strong> categories, of which{' '}
        <strong>{stats.noAuth.toLocaleString('en-GB')}</strong> need no API key at all.
      </p>
      <p>
        The catalogue is rebuilt on a schedule and committed to source control, so the site keeps
        working even if an upstream source disappears. That is not hypothetical: the API that
        several older directories were built on stopped resolving, and those sites now render
        nothing at all.
      </p>

      <h2>Who runs it</h2>
      <p>
        This site is built and maintained by <Link href="/authors/sandy">Sandy</Link>, an
        independent developer. It is a one-person project: the crawler that assembles the
        catalogue, the checker that probes every listing, the site itself and the writing are
        all mine.
      </p>
      <p>
        I also built{' '}
        <a href="https://savefrominternet.com" target="_blank" rel="noreferrer">
          SaveFromInternet
        </a>{' '}
        and GrabReels, both of which run on other people&rsquo;s APIs. Several years of that &mdash;
        parsers breaking when a platform shipped a change, rate limits arriving unannounced,
        endpoints disappearing overnight &mdash; is where this directory came from. I kept
        reaching for a list of free APIs and finding that nobody had checked whether the entries
        still worked.
      </p>
      <p>
        That is the whole claim to expertise here, and it is deliberately a narrow one: I am not
        an authority on every API listed, and the site does not pretend otherwise. What I can
        tell you is what happened when our checker called each one, on which date, and what came
        back. Everything published on this site is measured rather than repeated, and where we
        have not measured something we say so.
      </p>
      <p>
        Corrections are genuinely welcome. If a listing is wrong or out of date,{' '}
        <Link href="/contact">tell us</Link> and it gets fixed.
      </p>

      <h2>How we pay for it</h2>
      <p>
        The site is free and we intend to keep it that way. Running costs are covered by
        advertising. Ads never influence which APIs are listed, how they are ranked, or what our
        checks report. If that ever changes, it will be disclosed here and on the{' '}
        <Link href="/disclaimer">disclaimer page</Link> before it takes effect.
      </p>

      <h2>Corrections</h2>
      <p>
        If a listing is wrong, out of date, or unfairly marked as failing, tell us and we will
        look at it. Our <Link href="/editorial-policy">editorial policy</Link> sets out how we
        handle corrections. You can reach us through the{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </Prose>
  );
}
