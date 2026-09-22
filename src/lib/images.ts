import raw from '../../data/post-images.json';

/**
 * Hero photography, sourced through the Unsplash API by `npm run images`.
 *
 * Because the photos came from the API rather than a manual download, the Unsplash API
 * Guidelines apply: images must stay hotlinked on Unsplash's CDN, and every credit must
 * link to the photographer and to Unsplash with referral parameters. See ROADMAP §10.1.
 * `scripts/fetch-unsplash.ts` fires the required download ping when it picks a photo.
 */
export type PostImage = {
  slug: string;
  query: string;
  photoId: string;
  rawUrl: string;
  altDescription: string | null;
  colour: string;
  width: number;
  height: number;
  photographerName: string;
  photographerUsername: string;
  photoPageUrl: string;
  fetchedAt: string;
};

const images = raw as Record<string, PostImage>;

/** Unsplash wants this on every outbound link so they can attribute the referral. */
const UTM = 'utm_source=getfreeapis&utm_medium=referral';

export const withUtm = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${UTM}`;

export const unsplashHome = withUtm('https://unsplash.com');

export const photographerUrl = (image: PostImage) =>
  withUtm(`https://unsplash.com/@${image.photographerUsername}`);

export function getPostImage(slug: string): PostImage | null {
  return images[slug] ?? null;
}

export function getAllPostImages(): PostImage[] {
  return Object.values(images).sort((a, b) =>
    a.photographerName.localeCompare(b.photographerName),
  );
}

/**
 * Unsplash serve their CDN through imgix, so sizing is a query parameter rather than a
 * stored derivative. Asking for exactly the width we render keeps the payload small
 * without self-hosting, which the guidelines forbid for API-sourced photos.
 */
export function sizedUrl(image: PostImage, width: number, aspect = 2 / 1): string {
  const params = new URLSearchParams({
    w: String(width),
    h: String(Math.round(width / aspect)),
    fit: 'crop',
    crop: 'entropy',
    auto: 'format',
    q: '72',
  });
  return `${image.rawUrl}&${params.toString()}`;
}
