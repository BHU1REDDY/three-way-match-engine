'use client';

import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white/60 px-8 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
