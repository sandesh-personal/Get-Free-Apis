'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { SearchBox } from './SearchBox';

/**
 * The header search, bound to Cmd+K / Ctrl+K.
 *
 * Which modifier to advertise is a fact about the platform, not React state, so it is
 * read through useSyncExternalStore rather than set from an effect. The server cannot
 * know it, so it renders nothing and hydration fills it in.
 */
const noopSubscribe = () => () => {};

function shortcutHint(): string {
  return /mac|iphone|ipad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';
}

export function NavSearch({ className = '' }: { className?: string }) {
  const hint = useSyncExternalStore(noopSubscribe, shortcutHint, () => null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = wrap.current?.querySelector('input');
        input?.focus();
        input?.select();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={wrap} className={className}>
      <SearchBox placeholder="Search 2,700+ free APIs" shortcutHint={hint ?? undefined} />
    </div>
  );
}
