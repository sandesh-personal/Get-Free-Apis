'use client';

import { useMemo, useState } from 'react';
import { parseCurl, toAxios, toFetch, toPython } from '@/lib/curl';
import { CopyButton } from './CopyButton';
import { ToolPanel } from './ToolShell';

const TARGETS = [
  { id: 'fetch', label: 'fetch', run: toFetch },
  { id: 'axios', label: 'axios', run: toAxios },
  { id: 'python', label: 'Python', run: toPython },
] as const;

const EXAMPLE = `curl -X POST https://api.example.com/v1/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -d '{"name":"Ada","role":"admin"}'`;

export function CurlConverter() {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<(typeof TARGETS)[number]['id']>('fetch');

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const parsed = parseCurl(input);
      return { parsed, error: null as string | null };
    } catch (e) {
      return { parsed: null, error: (e as Error).message };
    }
  }, [input]);

  const code = useMemo(() => {
    if (!result?.parsed) return '';
    return TARGETS.find((t) => t.id === target)!.run(result.parsed);
  }, [result, target]);

  return (
    <div className="space-y-4">
      <ToolPanel
        label="cURL command"
        action={
          <button
            type="button"
            onClick={() => setInput(EXAMPLE)}
            className="type-badge cursor-pointer rounded-lg border border-border-subtle px-2.5 py-1.5 text-muted-strong transition hover:border-accent hover:text-accent"
          >
            Load example
          </button>
        }
      >
        <label htmlFor="curl-input" className="sr-only">
          cURL command
        </label>
        <textarea
          id="curl-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={7}
          spellCheck={false}
          placeholder={`curl https://api.example.com/users -H "Accept: application/json"`}
          aria-describedby={result?.error ? 'curl-error' : undefined}
          aria-invalid={result?.error ? true : undefined}
          className={`type-code w-full resize-y rounded-lg border bg-surface p-3 text-code outline-none transition ${
            result?.error ? 'border-no focus:border-no' : 'border-border-subtle focus:border-accent'
          }`}
        />

        {result?.error && (
          <p id="curl-error" role="alert" className="type-meta mt-2 text-no">
            {result.error}
          </p>
        )}

        {result?.parsed && result.parsed.ignored.length > 0 && (
          <p className="type-meta mt-2 text-unknown">
            Ignored {result.parsed.ignored.join(', ')} — {result.parsed.ignored.length === 1 ? 'it has' : 'they have'}{' '}
            no direct equivalent in the generated code.
          </p>
        )}
      </ToolPanel>

      <ToolPanel
        label="Generated code"
        action={<CopyButton value={code} label="Copy code" />}
      >
        <div role="tablist" aria-label="Output language" className="mb-3 flex flex-wrap gap-1.5">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={target === t.id}
              onClick={() => setTarget(t.id)}
              className={`type-badge cursor-pointer rounded-lg border px-3 py-1.5 transition ${
                target === t.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border-subtle text-muted hover:border-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {code ? (
          <pre className="type-code overflow-x-auto rounded-lg border border-border-subtle bg-surface p-3 text-code">
            <code>{code}</code>
          </pre>
        ) : (
          <p className="type-card-body rounded-lg border border-dashed border-border-strong p-6 text-center text-muted">
            Paste a cURL command above and the code appears here.
          </p>
        )}

        {result?.parsed && (
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <Fact label="Method" value={result.parsed.method} />
            <Fact label="Headers" value={String(Object.keys(result.parsed.headers).length)} />
            <Fact label="Body" value={result.parsed.body ? 'Yes' : 'None'} />
          </dl>
        )}
      </ToolPanel>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
      <dt className="type-stat-label text-muted">{label}</dt>
      <dd className="type-card-title">{value}</dd>
    </div>
  );
}
