'use client';

import { ReactNode } from 'react';

export interface FieldDef {
  label: string;
  value: ReactNode;
}

export function FormPanel({
  title,
  accentColor = 'border-l-indigo-500',
  fields,
}: {
  title: string;
  accentColor?: string;
  fields: FieldDef[];
}) {
  return (
    <div className={`rounded-xl border border-gray-200 border-l-[3px] bg-white p-5 shadow-sm ${accentColor}`}>
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-gray-800">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{f.label}</dt>
            <dd className="mt-1 truncate text-sm font-medium text-gray-900">{f.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
