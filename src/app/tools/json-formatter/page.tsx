import type { Metadata } from 'next';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { ToolShell } from '@/components/tools/ToolShell';
import { getTool } from '@/lib/tools';

const tool = getTool('json-formatter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
};

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <JsonFormatter />
    </ToolShell>
  );
}
