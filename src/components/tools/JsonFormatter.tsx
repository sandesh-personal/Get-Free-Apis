'use client';

import { useMemo, useState } from 'react';
import { CopyButton } from './CopyButton';
import { ToolPanel } from './ToolShell';

/**
 * Turns the browser's terse parse error into a line and column.
 *
 * V8 reports "... at position N" (and newer versions add line/column directly).
 * Position is the reliable part across engines, so it is converted here rather than
 * trusted from the message.
 */
function locate(input: string, error: Error): { line: number; column: number } | null {
  const match = /at position (\d+)/.exec(error.message);
  if (!match) return null;

  const pos = Math.min(Number(match[1]), input.length);
  const before = input.slice(0, pos);
  const line = before.split('\n').length;
  const column = pos - before.lastIndexOf('\n');
  return { line, column };
}

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [view, setView] = useState<'formatted' | 'tree'>('formatted');

  const parsed = useMemo(() => {
    if (!input.trim()) return { value: undefined as unknown, error: null as string | null };
    try {
      return { value: JSON.parse(input), error: null };
    } catch (e) {
      const where = locate(input, e as Error);
      return {
        value: undefined,
        error: where
          ? `${(e as Error).message.replace(/ at position \d+/, '')} — line ${where.line}, column ${where.column}`
          : (e as Error).message,
      };
    }
  }, [input]);

  const formatted = useMemo(
    () => (parsed.error || parsed.value === undefined ? '' : JSON.stringify(parsed.value, null, indent)),
    [parsed, indent],
  );

  const stats = useMemo(() => {
    if (parsed.error || parsed.value === undefined) return null;
    let nodes = 0;
    let depth = 0;
    const walk = (v: unknown, d: number) => {
      nodes++;
      depth = Math.max(depth, d);
      if (Array.isArray(v)) v.forEach((x) => walk(x, d + 1));
      else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, d + 1));
    };
    walk(parsed.value, 1);
    return { nodes, depth, bytes: new Blob([input]).size };
  }, [parsed, input]);

  return (
    <div className="space-y-4">
      <ToolPanel
        label="JSON input"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInput(JSON.stringify(SAMPLE))}
              className="type-badge cursor-pointer rounded-lg border border-border-subtle px-2.5 py-1.5 text-muted-strong transition hover:border-accent hover:text-accent"
            >
              Load example
            </button>
            <button
              type="button"
              disabled={!formatted}
              onClick={() => setInput(JSON.stringify(parsed.value))}
              className="type-badge cursor-pointer rounded-lg border border-border-subtle px-2.5 py-1.5 text-muted-strong transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Minify
            </button>
          </div>
        }
      >
        <label htmlFor="json-input" className="sr-only">
          JSON to format
        </label>
        <textarea
          id="json-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder='{"name":"Ada","roles":["admin","dev"]}'
          aria-invalid={parsed.error ? true : undefined}
          aria-describedby={parsed.error ? 'json-error' : undefined}
          className={`type-code w-full resize-y rounded-lg border bg-surface p-3 text-code outline-none transition ${
            parsed.error ? 'border-no focus:border-no' : 'border-border-subtle focus:border-accent'
          }`}
        />

        {parsed.error ? (
          <p id="json-error" role="alert" className="type-meta mt-2 text-no">
            {parsed.error}
          </p>
        ) : (
          input.trim() && (
            <p className="type-meta mt-2 flex items-center gap-1.5 text-ok">
              <span aria-hidden className="size-1.5 rounded-full bg-ok" />
              Valid JSON
              {stats && ` · ${stats.nodes} nodes · ${stats.depth} levels deep · ${stats.bytes} bytes`}
            </p>
          )
        )}
      </ToolPanel>

      <ToolPanel
        label="Output"
        action={<CopyButton value={formatted} label="Copy JSON" />}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Output view" className="flex gap-1.5">
            {(['formatted', 'tree'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`type-badge cursor-pointer rounded-lg border px-3 py-1.5 capitalize transition ${
                  view === v
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle text-muted hover:border-accent'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {view === 'formatted' && (
            <label className="type-meta flex items-center gap-2 text-muted">
              Indent
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-1 outline-none focus:border-accent"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={0}>Minified</option>
              </select>
            </label>
          )}
        </div>

        {!formatted ? (
          <p className="type-card-body rounded-lg border border-dashed border-border-strong p-6 text-center text-muted">
            {parsed.error ? 'Fix the error above to see the output.' : 'Paste JSON above to format it.'}
          </p>
        ) : view === 'formatted' ? (
          <pre className="type-code max-h-125 overflow-auto rounded-lg border border-border-subtle bg-surface p-3 text-code">
            <code>{formatted}</code>
          </pre>
        ) : (
          <div className="type-code max-h-125 overflow-auto rounded-lg border border-border-subtle bg-surface p-3">
            <TreeNode value={parsed.value} name="root" depth={0} />
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/** Collapsible tree. Objects and arrays open by default for the first two levels. */
function TreeNode({ value, name, depth }: { value: unknown; name: string; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === 'object';

  if (!isArray && !isObject) {
    return (
      <div style={{ paddingLeft: depth * 14 }} className="py-0.5">
        <span className="text-muted">{name}</span>
        <span className="text-muted">: </span>
        <ValueLabel value={value} />
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1 py-0.5 text-left hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-muted">{name}</span>
        <span className="text-muted-strong">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>

      {open && entries.map(([k, v]) => <TreeNode key={k} value={v} name={k} depth={depth + 1} />)}
    </div>
  );
}

function ValueLabel({ value }: { value: unknown }) {
  if (value === null) return <span className="text-oauth">null</span>;
  if (typeof value === 'boolean') return <span className="text-oauth">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-key">{value}</span>;
  return <span className="text-ok">&quot;{String(value)}&quot;</span>;
}

const SAMPLE = {
  id: 42,
  name: 'Ada Lovelace',
  active: true,
  roles: ['admin', 'engineer'],
  address: { city: 'London', postcode: 'NW1 5LN' },
  lastSeen: null,
};
