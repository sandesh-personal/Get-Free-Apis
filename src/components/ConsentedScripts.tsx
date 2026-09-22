'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { readConsent, subscribeConsent } from '@/lib/consent';

/**
 * Loads advertising and analytics only once consent has actually been given.
 *
 * This is the thing that makes Reject mean something. Previously the AdSense loader
 * sat in <head> and ran for everyone, so the banner recorded a preference that no
 * code consulted — which is worse than having no banner, because it claims a choice
 * the visitor does not really have.
 *
 * The script is injected imperatively rather than rendered, so it is appended exactly
 * once and only after the decision. Accepting takes effect immediately, with no
 * reload, because the consent event re-renders this component.
 *
 * Note there is no un-load path: scripts cannot be recalled once executed. Someone
 * who accepts and later withdraws keeps the script for that page view and gets a
 * clean load on the next navigation. That is the standard behaviour and the reason
 * withdrawal should also clear whatever the script stored.
 */
export function ConsentedScripts({ adsensePublisherId }: { adsensePublisherId: string | null }) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsent,
    () => 'unset' as const,
  );

  useEffect(() => {
    if (consent !== 'accepted' || !adsensePublisherId) return;
    if (document.getElementById('adsense-loader')) return;

    const script = document.createElement('script');
    script.id = 'adsense-loader';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      encodeURIComponent(adsensePublisherId);

    document.head.appendChild(script);
  }, [consent, adsensePublisherId]);

  // On withdrawal, drop the cookies the advertising script set. It cannot be
  // unloaded, but its storage can go, and the next page view starts clean.
  useEffect(() => {
    if (consent !== 'rejected') return;

    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim();
      if (!name) continue;
      if (!/^(_ga|_gid|_gat|__gads|__gpi|IDE|test_cookie)/.test(name)) continue;

      for (const domain of [location.hostname, `.${location.hostname}`]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      }
    }
  }, [consent]);

  return null;
}
