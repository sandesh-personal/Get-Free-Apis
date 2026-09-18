'use client';

import { useState } from 'react';

export type Snippet = { id: string; label: string; language: string; code: string };

export function CodeTabs({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = useState(snippets[0]?.id);
  const [copied, setCopied] = useState(false);

  const current = snippets.find((s) => s.id === active) ?? snippets[0];
  if (!current) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
      <div className="flex items-center gap-1 border-b border-border-subtle bg-surface px-2 py-1.5">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            onClick={() => setActive(snippet.id)}
            aria-pressed={snippet.id === current.id}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              snippet.id === current.id
                ? 'bg-surface-raised text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {snippet.label}
          </button>
        ))}

        <button
          type="button"
          onClick={copy}
          className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-accent"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}
