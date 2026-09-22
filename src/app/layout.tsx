import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CookieNotice } from '@/components/CookieNotice';
import { ConsentedScripts } from '@/components/ConsentedScripts';
import { consentScript } from '@/lib/consent';
import { themeScript } from '@/lib/theme';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.titleDefault,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'free api',
    'free api for developers',
    'public api',
    'free public apis',
    'api directory',
    'no api key',
    'rest api list',
    'apis for developers',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: site.titleDefault,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: site.twitter,
    title: site.titleDefault,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

/**
 * Light is the fixed default, so the browser chrome is tinted to match it
 * unconditionally rather than keyed to the OS preference.
 */
export const viewport: Viewport = {
  themeColor: '#fafafa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <head>
        {/* Must run before paint so the banner does not flash for returning visitors. */}
        <script dangerouslySetInnerHTML={{ __html: consentScript }} />

        {/* Same reason: stamps <html data-theme> so a chosen theme never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/*
          Declared here rather than through `metadata.alternates.types`, because a
          page that sets its own `alternates` (every page with a canonical) replaces
          the layout's wholesale and the feed link disappears with it.
        */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${site.name} — Articles`}
          href="/blog/feed.xml"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-on"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieNotice />
        <ConsentedScripts adsensePublisherId={site.adsensePublisherId} />
      </body>
    </html>
  );
}
