import { getPostImage, photographerUrl, sizedUrl, unsplashHome } from '@/lib/images';

/**
 * Article header photograph.
 *
 * The <img> is deliberate rather than `next/image`. These photos came from the Unsplash
 * API, whose guidelines require the rendered URL to be Unsplash's own CDN link. Next's
 * optimiser would re-host the bytes under /_next/image, which is exactly what that rule
 * forbids, so we hotlink and let Unsplash's imgix resize for us. See ROADMAP §10.1.
 */
export function PostHero({ slug, title }: { slug: string; title: string }) {
  const image = getPostImage(slug);
  if (!image) return null;

  const alt = image.altDescription
    ? `${image.altDescription}, illustrating ${title.toLowerCase()}`
    : `Decorative photograph accompanying ${title.toLowerCase()}`;

  return (
    <figure className="mb-8">
      <div
        className="overflow-hidden rounded-xl border border-border-subtle"
        style={{ backgroundColor: image.colour, aspectRatio: '2 / 1' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- see component note */}
        <img
          src={sizedUrl(image, 1200)}
          srcSet={[640, 960, 1200, 1600].map((w) => `${sizedUrl(image, w)} ${w}w`).join(', ')}
          sizes="(min-width: 1024px) 720px, 100vw"
          alt={alt}
          width={1200}
          height={600}
          fetchPriority="high"
          className="size-full object-cover"
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        Photo by{' '}
        <a href={photographerUrl(image)} target="_blank" rel="noreferrer" className="hover:text-accent">
          {image.photographerName}
        </a>{' '}
        on{' '}
        <a href={unsplashHome} target="_blank" rel="noreferrer" className="hover:text-accent">
          Unsplash
        </a>
        .
      </figcaption>
    </figure>
  );
}
