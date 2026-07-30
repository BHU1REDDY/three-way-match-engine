'use client';

import { Badge } from './Badge';
import type { MatchStatus } from '@/types/api';

export const STATUS_CONFIG: Record<MatchStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'gray' }> = {
  matched: { label: 'Matched', tone: 'green' },
  partially_matched: { label: 'Partially Matched', tone: 'amber' },
  mismatch: { label: 'Mismatch', tone: 'red' },
  insufficient_documents: { label: 'Insufficient Documents', tone: 'gray' },
};

export function StatusBadge({ status, className }: { status: MatchStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge tone={config.tone} dot className={className}>
      {config.label}
    </Badge>
  );
}
