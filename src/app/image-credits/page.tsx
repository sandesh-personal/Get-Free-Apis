import type { Metadata } from 'next';
import { Prose, Todo } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Image credits',
  description: `Photographer credits and licensing information for imagery used across ${site.name}.`,
  alternates: { canonical: '/image-credits' },
  robots: { index: false, follow: true },
};

export default function ImageCreditsPage() {
  return (
    <Prose
      title="Image credits"
      intro="Who made the photographs used on this site."
      updated="2026-09-18"
    >
      <h2>Photography</h2>
      <p>
        Article header photography comes from{' '}
        <a href="https://unsplash.com" target="_blank" rel="noreferrer">
          Unsplash
        </a>{' '}
        and is used under the{' '}
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          Unsplash License
        </a>
        , which permits commercial use without attribution. We credit photographers anyway,
        because being able to see who made something is the same principle we apply to our own
        work.
      </p>
      <p>
        <Todo>
          This list is generated from data/image-credits.json by the image pipeline. Run the
          download script and it will populate automatically.
        </Todo>
      </p>

      <h2>Diagrams and screenshots</h2>
      <p>
        Every diagram, chart and annotated screenshot on {site.domain} is made by us and shows real
        output captured on the date noted in the article. They may be reused with attribution and a
        link back to the page they came from.
      </p>

      <h2>Emoji</h2>
      <p>
        Category and listing emoji render using the reader&rsquo;s own system font, so they appear
        in whichever style their device provides. No emoji artwork is bundled with this site.
      </p>
    </Prose>
  );
}
