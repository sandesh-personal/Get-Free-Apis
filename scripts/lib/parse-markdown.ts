import type { RawEntry } from './types';
import {
  cleanText,
  cleanUrl,
  normaliseAuth,
  normaliseBool,
  normaliseCors,
} from './normalise';

/**
 * Sections to skip entirely. The public-apis README opens with a sponsored APILayer
 * table whose columns are a completely different shape (it embeds Postman run buttons
 * where Auth/HTTPS/CORS should be). Parsing it produces garbage rows, so drop it by name.
 */
const SKIPPED_SECTIONS = [
  'apis covered under apilayer suite',
  'index',
  'contributing',
  'license',
];

function isSkipped(heading: string): boolean {
  const h = heading.toLowerCase().replace(/[^a-z ]/g, '').trim();
  return SKIPPED_SECTIONS.some((s) => h.startsWith(s));
}

/** Matches a leading `[Title](https://url)` cell. */
const LINK_CELL = /^\s*\[([^\]]+)\]\(\s*([^)\s]+)[^)]*\)\s*$/;

/**
 * Parses a public-apis style README into entries.
 *
 * The tables are hand-maintained and inconsistent: trailing pipes appear and disappear,
 * blank lines interrupt tables, and some rows carry a sixth empty cell. So rather than
 * one large regex we walk line by line and validate each row's shape.
 */
export function parseApiMarkdown(markdown: string, source: string): RawEntry[] {
  const entries: RawEntry[] = [];
  let category = 'Uncategorised';
  let skipping = false;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (heading) {
      const title = cleanText(heading[1]).replace(/\s*\[.*$/, '');
      skipping = isSkipped(title);
      if (!skipping) category = title;
      continue;
    }

    if (skipping) continue;
    if (!line.trimStart().startsWith('|')) continue;

    // Split on pipes, dropping the empty cells produced by the leading/trailing pipe.
    const cells = line.split('|');
    if (cells[0].trim() === '') cells.shift();
    if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
    if (cells.length < 2) continue;

    // Header separator rows such as |:---|:---|
    if (/^[:\-\s]+$/.test(cells[0])) continue;

    const link = cells[0].match(LINK_CELL);
    if (!link) continue;

    const url = cleanUrl(link[2]);
    if (!url) continue; // drops the Index section's #anchor links automatically

    const name = cleanText(link[1]);
    if (!name) continue;

    entries.push({
      name,
      description: cleanText(cells[1] ?? ''),
      category,
      url,
      auth: normaliseAuth(cells[2] ?? ''),
      https: normaliseBool(cells[3] ?? ''),
      cors: normaliseCors(cells[4] ?? ''),
      source,
    });
  }

  return entries;
}
