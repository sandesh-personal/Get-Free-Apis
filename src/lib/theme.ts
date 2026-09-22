/**
 * Theme state, shared by the toggle and by anything that needs to know the mode.
 *
 * Light is the site's fixed default. The OS preference is deliberately NOT consulted:
 * a visitor whose system is set to dark still gets the light theme until they choose
 * dark here. Only an explicit choice is stored, and only dark is ever written to the
 * attribute — its absence means light.
 *
 * Deliberately mirrors `consent.ts`: the value lives on <html data-theme> so CSS can
 * read it before first paint, and localStorage holds the durable copy.
 */
export const THEME_KEY = 'gfa-theme';
export const THEME_EVENT = 'gfa:theme';

export type Theme = 'light' | 'dark';

/**
 * Runs before paint, so it stays tiny and dependency-free. Without this the page
 * would render light and then flip to dark for a returning visitor who chose dark.
 */
export const themeScript = `(function(){try{if(localStorage.getItem('${THEME_KEY}')==='dark'){document.documentElement.dataset.theme='dark';}}catch(e){}})();`;

export function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'dark') localStorage.setItem(THEME_KEY, 'dark');
    else localStorage.removeItem(THEME_KEY);
  } catch {
    // Private browsing can refuse storage. The attribute below still applies for
    // this visit; we simply start from light again next time.
  }

  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;

  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/** Subscription shape for useSyncExternalStore. */
export function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
