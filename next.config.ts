import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Lets the dev server be reached from other devices on the LAN (e.g. testing on a
  // phone at this machine's IP) without Next's cross-origin dev-resource block
  // silently breaking client-side hydration for that origin.
  allowedDevOrigins: ['192.168.1.85'],
  async redirects() {
    return [
      {
        // The Machine Learning category was renamed to AI. Permanent, because the
        // old slug was live and is in the sitemap Google already crawled.
        source: '/categories/machine-learning',
        destination: '/categories/ai',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
