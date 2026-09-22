import type { Metadata } from 'next';
import { CurlConverter } from '@/components/tools/CurlConverter';
import { ToolShell } from '@/components/tools/ToolShell';
import { getTool } from '@/lib/tools';

const tool = getTool('curl-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
};

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CurlConverter />
    </ToolShell>
  );
}
