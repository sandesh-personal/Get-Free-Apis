import type { Metadata } from 'next';
import { CorsChecker } from '@/components/tools/CorsChecker';
import { ToolShell } from '@/components/tools/ToolShell';
import { getTool } from '@/lib/tools';

const tool = getTool('cors-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
};

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CorsChecker />
    </ToolShell>
  );
}
