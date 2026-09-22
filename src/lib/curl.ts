/**
 * cURL command parser and code generator.
 *
 * Kept out of the component so the parsing rules are readable on their own — the
 * fiddly part is the shell tokenizer, not the code templates.
 *
 * Scope is deliberate: the flags people actually paste out of API docs and devtools
 * ("Copy as cURL"). Anything unrecognised is reported back rather than silently
 * dropped, because quietly ignoring `--cert` and handing back code that does
 * something different is worse than saying so.
 */
export type ParsedCurl = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  /** Flags we saw but do not translate. Surfaced in the UI. */
  ignored: string[];
};

/** Flags that take a value we do not use, so the value must be skipped too. */
const SKIP_WITH_VALUE = new Set([
  '--cert',
  '--key',
  '--cacert',
  '--connect-timeout',
  '--max-time',
  '-m',
  '--retry',
  '--proxy',
  '-x',
  '--cookie-jar',
  '-c',
  '--output',
  '-o',
  '-w',
  '--write-out',
  '-A',
  '--user-agent',
  '-e',
  '--referer',
]);

/** Boolean flags that change nothing about the generated request. */
const SKIP_BOOLEAN = new Set([
  '-s',
  '--silent',
  '-S',
  '--show-error',
  '-k',
  '--insecure',
  '-L',
  '--location',
  '-v',
  '--verbose',
  '-i',
  '--include',
  '-f',
  '--fail',
  '--compressed',
  '-g',
  '--globoff',
  '-N',
  '--no-buffer',
]);

/**
 * Splits a command line the way a shell would: honouring single and double quotes,
 * backslash escapes, and backslash-newline continuations.
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let started = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (quote) {
      if (ch === '\\' && quote === '"' && i + 1 < input.length) {
        current += input[++i];
      } else if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true; // so an empty quoted string survives as a token
      continue;
    }

    if (ch === '\\') {
      // Line continuation: swallow the newline that follows.
      if (input[i + 1] === '\n') {
        i++;
        continue;
      }
      if (input[i + 1] === '\r' && input[i + 2] === '\n') {
        i += 2;
        continue;
      }
      if (i + 1 < input.length) current += input[++i];
      continue;
    }

    if (/\s/.test(ch)) {
      if (current || started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }

    current += ch;
  }

  if (current || started) tokens.push(current);
  return tokens;
}

export function parseCurl(input: string): ParsedCurl {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Paste a cURL command to convert.');

  const tokens = tokenize(trimmed);
  if (tokens[0] !== 'curl') {
    throw new Error('That does not start with `curl`. Paste the whole command.');
  }

  const headers: Record<string, string> = {};
  const ignored: string[] = [];
  const dataParts: string[] = [];
  let url = '';
  let method = '';
  let isForm = false;

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      method = (tokens[++i] ?? '').toUpperCase();
    } else if (token === '-H' || token === '--header') {
      const raw = tokens[++i] ?? '';
      const at = raw.indexOf(':');
      if (at > 0) headers[raw.slice(0, at).trim()] = raw.slice(at + 1).trim();
    } else if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii'
    ) {
      dataParts.push(tokens[++i] ?? '');
    } else if (token === '--data-urlencode') {
      dataParts.push(tokens[++i] ?? '');
      isForm = true;
    } else if (token === '-F' || token === '--form') {
      dataParts.push(tokens[++i] ?? '');
      isForm = true;
    } else if (token === '-u' || token === '--user') {
      const creds = tokens[++i] ?? '';
      // btoa is not available when this runs on the server during prerender.
      const encoded =
        typeof btoa === 'function'
          ? btoa(creds)
          : Buffer.from(creds, 'utf8').toString('base64');
      headers.Authorization = `Basic ${encoded}`;
    } else if (token === '-b' || token === '--cookie') {
      headers.Cookie = tokens[++i] ?? '';
    } else if (token === '--url') {
      url = tokens[++i] ?? '';
    } else if (token === '-G' || token === '--get') {
      method = method || 'GET';
    } else if (SKIP_WITH_VALUE.has(token)) {
      ignored.push(token);
      i++;
    } else if (SKIP_BOOLEAN.has(token)) {
      // No effect on the generated request.
    } else if (token.startsWith('-')) {
      ignored.push(token);
    } else if (!url) {
      url = token;
    }
  }

  if (!url) throw new Error('No URL found in that command.');

  const body = dataParts.length ? dataParts.join('&') : undefined;
  if (!method) method = body ? 'POST' : 'GET';

  // curl sets this itself when -d is used and nothing else is specified.
  if (body && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = isForm
      ? 'application/x-www-form-urlencoded'
      : looksLikeJson(body)
        ? 'application/json'
        : 'application/x-www-form-urlencoded';
  }

  return { url, method, headers, body, ignored };
}

function looksLikeJson(body: string): boolean {
  const t = body.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function headerLines(headers: Record<string, string>, indent: string): string {
  const entries = Object.entries(headers);
  if (!entries.length) return '';
  return entries.map(([k, v]) => `${indent}${q(k)}: ${q(v)},`).join('\n');
}

/** Pretty-prints a JSON body inline so the generated code is readable. */
function jsonBodyLiteral(body: string, indent: string): string | null {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : indent + line))
      .join('\n');
  } catch {
    return null;
  }
}

export function toFetch(p: ParsedCurl): string {
  const opts: string[] = [`  method: ${q(p.method)},`];

  const hl = headerLines(p.headers, '    ');
  if (hl) opts.push(`  headers: {\n${hl}\n  },`);

  if (p.body !== undefined) {
    const pretty = jsonBodyLiteral(p.body, '  ');
    opts.push(pretty ? `  body: JSON.stringify(${pretty}),` : `  body: ${q(p.body)},`);
  }

  return `const response = await fetch(${q(p.url)}, {
${opts.join('\n')}
});

if (!response.ok) {
  throw new Error(\`\${response.status} \${response.statusText}\`);
}

const data = await response.json();
console.log(data);`;
}

export function toAxios(p: ParsedCurl): string {
  const opts: string[] = [
    `  method: ${q(p.method.toLowerCase())},`,
    `  url: ${q(p.url)},`,
  ];

  const hl = headerLines(p.headers, '    ');
  if (hl) opts.push(`  headers: {\n${hl}\n  },`);

  if (p.body !== undefined) {
    const pretty = jsonBodyLiteral(p.body, '  ');
    opts.push(pretty ? `  data: ${pretty},` : `  data: ${q(p.body)},`);
  }

  return `import axios from 'axios';

const { data } = await axios({
${opts.join('\n')}
});

console.log(data);`;
}

export function toPython(p: ParsedCurl): string {
  const lines: string[] = ['import requests', ''];

  const entries = Object.entries(p.headers);
  if (entries.length) {
    lines.push('headers = {');
    for (const [k, v] of entries) lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    lines.push('}', '');
  }

  let bodyArg = '';
  if (p.body !== undefined) {
    try {
      const parsed = JSON.parse(p.body);
      lines.push(`payload = ${pythonLiteral(parsed, 0)}`, '');
      bodyArg = ', json=payload';
    } catch {
      lines.push(`payload = ${JSON.stringify(p.body)}`, '');
      bodyArg = ', data=payload';
    }
  }

  lines.push(
    `response = requests.request(${JSON.stringify(p.method)}, ${JSON.stringify(p.url)}` +
      `${entries.length ? ', headers=headers' : ''}${bodyArg}, timeout=10)`,
    'response.raise_for_status()',
    '',
    'print(response.json())',
  );

  return lines.join('\n');
}

/** JSON is close enough to Python literals apart from the three keywords. */
function pythonLiteral(value: unknown, depth: number): string {
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);

  if (value === null) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((v) => pad + pythonLiteral(v, depth + 1)).join(',\n')}\n${closePad}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return '{}';
  return `{\n${entries
    .map(([k, v]) => `${pad}${JSON.stringify(k)}: ${pythonLiteral(v, depth + 1)}`)
    .join(',\n')}\n${closePad}}`;
}
