'use client';

import { ReactNode } from 'react';

type Tone = 'gray' | 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'emerald';

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  emerald: 'bg-emerald-50 text-emerald-700',
};

export function Badge({
  tone = 'gray',
  children,
  className = '',
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
