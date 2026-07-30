'use client';

import { ReactNode } from 'react';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M10 13H8M16 13h-2M16 17H8" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

export function StatCards({
  poAmount,
  totalInvoiced,
  totalReceived,
}: {
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
}) {
  const cards: { label: string; value: number; iconBg: string; iconText: string; icon: ReactNode }[] = [
    {
      label: 'PO Amount',
      value: poAmount,
      iconBg: 'bg-indigo-50',
      iconText: 'text-indigo-600',
      icon: <FileTextIcon />,
    },
    {
      label: 'Total Invoiced',
      value: totalInvoiced,
      iconBg: 'bg-purple-50',
      iconText: 'text-purple-600',
      icon: <ReceiptIcon />,
    },
    {
      label: 'Total Received',
      value: totalReceived,
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      icon: <TruckIcon />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>
            {c.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{c.label}</p>
            <p className="mt-1 truncate text-xl font-semibold tracking-tight text-gray-900">
              {formatCurrency(c.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
