import type { Metadata } from 'next';
import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { ToolShell } from '@/components/tools/ToolShell';
import { getTool } from '@/lib/tools';

const tool = getTool('jwt-decoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
};

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <JwtDecoder />
    </ToolShell>
  );
}
