'use client';

import { HTMLAttributes, ReactNode } from 'react';

export function Card({
  children,
  className = '',
  padded = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; padded?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
