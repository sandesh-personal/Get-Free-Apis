/**
 * Typographic shell for article content.
 *
 * Tailwind v4 ships without the typography plugin, so the vertical rhythm, code-block
 * treatment and dual-theme Shiki handling live here in one place rather than being
 * repeated across every post.
 */
export function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        text-[15px] leading-relaxed

        [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight
        [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold
        [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-semibold
        [&_.heading-anchor]:text-inherit [&_.heading-anchor]:no-underline

        [&_p]:mb-5 [&_p]:text-muted-strong
        [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
        [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
        [&_li]:text-muted-strong [&_li_p]:mb-2
        [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-border-strong
        [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_hr]:my-10 [&_hr]:border-t [&_hr]:border-[var(--border)]

        [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-surface
        [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5
        [&_:not(pre)>code]:text-[0.875em] [&_:not(pre)>code]:text-foreground

        [&_figure[data-rehype-pretty-code-figure]]:my-6
        [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border
        [&_pre]:border-border-subtle [&_pre]:bg-surface [&_pre]:p-4
        [&_pre]:text-[13px] [&_pre]:leading-relaxed
        [&_pre_code]:grid [&_pre_code]:bg-transparent
        [&_[data-line]]:px-0

        [&_table]:my-6 [&_table]:w-full [&_table]:text-sm
        [&_thead]:bg-surface
        [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-muted-strong
      "
    >
      {children}
    </div>
  );
}
