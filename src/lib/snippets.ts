import type { Api } from './apis';
import type { Snippet } from '@/components/CodeTabs';

/**
 * Upstream sources give us a documentation URL, not a concrete endpoint. Rather than
 * invent an endpoint that would send people down a dead end, snippets use the API's
 * own origin as the base and mark the path as something to fill in from the docs.
 * Honest placeholders beat plausible fiction.
 */
function baseUrl(api: Api): string {
  try {
    return new URL(api.url).origin;
  } catch {
    return api.url;
  }
}

function authNoteFor(api: Api): { header?: string; comment: string } {
  switch (api.auth) {
    case 'none':
      return { comment: 'No authentication required.' };
    case 'apiKey':
      return {
        header: 'Authorization: Bearer YOUR_API_KEY',
        comment: 'Requires an API key. Check the docs for whether it goes in a header or a query parameter.',
      };
    case 'oauth':
      return {
        header: 'Authorization: Bearer YOUR_ACCESS_TOKEN',
        comment: 'Uses OAuth. Exchange your credentials for an access token first.',
      };
    default:
      return {
        header: 'Authorization: Bearer YOUR_TOKEN',
        comment: 'Authentication requirement is unconfirmed. Check the documentation before relying on this.',
      };
  }
}

export function buildSnippets(api: Api): Snippet[] {
  const base = baseUrl(api);
  const endpoint = `${base}/ENDPOINT`;
  const auth = authNoteFor(api);

  const curl = [
    `# ${auth.comment}`,
    `curl -s "${endpoint}" \\`,
    ...(auth.header ? [`  -H "${auth.header}" \\`] : []),
    '  -H "Accept: application/json"',
  ].join('\n');

  const headerLines = auth.header
    ? `\n  headers: {\n    '${auth.header.split(': ')[0]}': '${auth.header.split(': ').slice(1).join(': ')}',\n    Accept: 'application/json',\n  },`
    : `\n  headers: { Accept: 'application/json' },`;

  const javascript = `// ${auth.comment}
const response = await fetch('${endpoint}', {${headerLines}
});

if (!response.ok) {
  throw new Error(\`\${response.status} \${response.statusText}\`);
}

const data = await response.json();
console.log(data);`;

  const pythonHeaders = auth.header
    ? `headers = {\n    "${auth.header.split(': ')[0]}": "${auth.header.split(': ').slice(1).join(': ')}",\n    "Accept": "application/json",\n}`
    : `headers = {"Accept": "application/json"}`;

  const python = `# ${auth.comment}
import requests

${pythonHeaders}

response = requests.get("${endpoint}", headers=headers, timeout=10)
response.raise_for_status()

print(response.json())`;

  return [
    { id: 'curl', label: 'curl', language: 'bash', code: curl },
    { id: 'js', label: 'JavaScript', language: 'javascript', code: javascript },
    { id: 'python', label: 'Python', language: 'python', code: python },
  ];
}
