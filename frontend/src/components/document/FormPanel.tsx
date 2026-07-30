'use client';

import { ReactNode } from 'react';

export interface FieldDef {
  label: string;
  value: ReactNode;
}

export function FormPanel({
  title,
  accentColor = 'border-l-blue-500',
  fields,
}: {
  title: string;
  accentColor?: string;
  fields: FieldDef[];
}) {
  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm ${accentColor}`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs uppercase tracking-wide text-gray-400">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{f.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
