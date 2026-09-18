/**
 * Catches MDX syntax hazards before a build fails on them.
 *
 * MDX parses a bare `<` in prose as the start of a JSX tag, so a sentence like
 * "the token < appears" is a build error rather than text. Fenced and inline code
 * are exempt, which is where these characters normally belong.
 *
 *   npx tsx scripts/lint-mdx.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'content', 'blog');
let problems = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx'))) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  const body = raw.split(/^---\s*$/m).slice(2).join('---');

  let inFence = false;

  body.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    // Remove inline code spans, where < and { are legitimate.
    const stripped = line.replace(/`[^`]*`/g, '');

    // A `<` not followed by a letter, `/` or `!` cannot start a valid JSX tag.
    if (/<(?![A-Za-z/!])/.test(stripped)) {
      console.error(`${file}:${i + 1}  bare "<" in prose -> wrap it in backticks`);
      problems++;
    }

    // A lone `{` outside code is read as a JSX expression.
    if (/(?<!\{)\{(?!\{)/.test(stripped) && !/^\s*<[A-Z]/.test(stripped)) {
      console.error(`${file}:${i + 1}  bare "{" in prose -> wrap it in backticks`);
      problems++;
    }
  });
}

if (problems > 0) {
  console.error(`\n${problems} MDX hazard(s) found.`);
  process.exit(1);
}
console.log('MDX looks clean.');
