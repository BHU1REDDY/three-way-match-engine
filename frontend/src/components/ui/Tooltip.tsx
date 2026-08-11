'use client';

import { ReactNode, useState } from 'react';

/** Lightweight hover tooltip, no external deps. Positions above the trigger by default. */
export function Tooltip({
  content,
  children,
  width = 'max-w-xs',
}: {
  content: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-normal normal-case leading-snug text-white shadow-lg ${width}`}
        >
          {content}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

/** Small circled "i" icon meant to be wrapped in a Tooltip. */
export function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-350 ${className}`}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-5M12 8h.01" />
    </svg>
  );
}
