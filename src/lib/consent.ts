/**
 * Consent state, shared by the banner and by anything gated on it.
 *
 * The value lives on <html data-consent> rather than in React state, because it has
 * to be readable by CSS before first paint — that is what stops the banner flashing
 * for someone who already answered. localStorage is the durable copy.
 */
export const CONSENT_KEY = 'gfa-cookie-consent';
export const CONSENT_EVENT = 'gfa:consent';

export type Consent = 'accepted' | 'rejected' | 'unset';

/** Runs before paint, so it stays tiny and dependency-free. */
export const consentScript = `(function(){try{var v=localStorage.getItem('${CONSENT_KEY}');document.documentElement.dataset.consent=v==='accepted'||v==='rejected'?v:'unset';}catch(e){document.documentElement.dataset.consent='unset';}})();`;

export function readConsent(): Consent {
  if (typeof document === 'undefined') return 'unset';
  const value = document.documentElement.dataset.consent;
  return value === 'accepted' || value === 'rejected' ? value : 'unset';
}

export function setConsent(value: Consent) {
  try {
    if (value === 'unset') localStorage.removeItem(CONSENT_KEY);
    else localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private browsing can refuse storage. The in-page state below still applies
    // for this visit; we simply ask again next time.
  }

  document.documentElement.dataset.consent = value;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Lets the footer control reopen the banner so a choice can be changed. */
export function reopenConsent() {
  setConsent('unset');
}

/** Subscription shape for useSyncExternalStore. */
export function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
