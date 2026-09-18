import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code';
import { mdxComponents } from './MdxComponents';

/**
 * Compiles and renders a post at build time.
 *
 * This uses MDX's own `evaluate` rather than next-mdx-remote. That library picks its
 * JSX runtime from NODE_ENV while MDX compiles against its own `development` setting,
 * and when the two disagree every prop passed to a custom component arrives empty.
 * `<ApiTable ids={[...]} />` silently became `<ApiTable />`. Going direct removes the
 * mismatch entirely and drops a dependency.
 *
 * Highlighting runs here at build time via Shiki, so no highlighter ships to the browser.
 * Both themes are emitted at once and CSS chooses between them, which keeps code
 * readable in dark mode with no hydration step and no flash.
 */
const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark-dimmed' },
  keepBackground: false,
  defaultLang: 'text',
};

export async function MdxContent({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, prettyCodeOptions],
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }],
    ],
  });

  return <Content components={mdxComponents} />;
}
