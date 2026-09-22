import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/Prose';
import { getAllPostImages, photographerUrl, unsplashHome } from '@/lib/images';
import { getPost } from '@/lib/blog';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Image credits',
  description: `Photographer credits and licensing information for imagery used across ${site.name}.`,
  alternates: { canonical: '/image-credits' },
  robots: { index: false, follow: true },
};

export default function ImageCreditsPage() {
  const images = getAllPostImages();

  return (
    <Prose
      title="Image credits"
      intro="Who made the photographs used on this site."
      updated="2026-09-20"
    >
      <h2>Photography</h2>
      <p>
        Article header photography is served from{' '}
        <a href={unsplashHome} target="_blank" rel="noreferrer">
          Unsplash
        </a>
        . Because we select these photographs through the Unsplash API rather than
        downloading them by hand, our use falls under the{' '}
        <a
          href="https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines"
          target="_blank"
          rel="noreferrer"
        >
          Unsplash API Guidelines
        </a>
        . Those guidelines require attribution, so every photograph below credits its
        photographer both here and in the caption beneath the image itself.
      </p>
      <p>
        They also require that the images stay hosted on Unsplash rather than being copied
        onto our servers. That is why article headers load from Unsplash&rsquo;s own CDN. No
        photograph on this site is stored by us.
      </p>

      <h3>{images.length} photographs in use</h3>
      <ul>
        {images.map((image) => {
          const post = getPost(image.slug);
          return (
            <li key={image.photoId}>
              <a href={image.photoPageUrl} target="_blank" rel="noreferrer">
                Photograph
              </a>{' '}
              by{' '}
              <a href={photographerUrl(image)} target="_blank" rel="noreferrer">
                {image.photographerName}
              </a>
              {post && (
                <>
                  {' '}
                  &mdash; used on <Link href={`/blog/${image.slug}`}>{post.title}</Link>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <h2>Diagrams and screenshots</h2>
      <p>
        Every diagram, chart and annotated screenshot on {site.domain} is made by us and shows real
        output captured on the date noted in the article. They may be reused with attribution and a
        link back to the page they came from.
      </p>

      <h2>Icons</h2>
      <p>
        The few icons on this site &mdash; search, navigation, the status swatches &mdash; are
        inline SVG paths written for this project. Nothing is loaded from an icon library, and
        no icon font is bundled.
      </p>
    </Prose>
  );
}
