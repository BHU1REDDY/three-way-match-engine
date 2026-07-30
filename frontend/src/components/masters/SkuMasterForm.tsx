'use client';

import { useState, FormEvent, useEffect } from 'react';
import type { SkuMaster } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';

export interface SkuMasterFormValues {
  skuErpCode: string;
  name: string;
  eanCode: string;
  hsnCode: string;
  uom: string;
  agreedRate: string;
  mrp: string;
  priceTolerance: string;
}

function toFormValues(sku?: SkuMaster | null): SkuMasterFormValues {
  return {
    skuErpCode: sku?.skuErpCode ?? '',
    name: sku?.name ?? '',
    eanCode: sku?.eanCode ?? '',
    hsnCode: sku?.hsnCode ?? '',
    uom: sku?.uom ?? '',
    agreedRate: sku?.agreedRate != null ? String(sku.agreedRate) : '',
    mrp: sku?.mrp != null ? String(sku.mrp) : '',
    priceTolerance: sku?.priceTolerance != null ? String(sku.priceTolerance) : '0.05',
  };
}

export function SkuMasterForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  error,
}: {
  initial?: SkuMaster | null;
  onSubmit: (payload: Partial<SkuMaster>) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  error?: unknown;
}) {
  const [values, setValues] = useState<SkuMasterFormValues>(toFormValues(initial));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(toFormValues(initial));
  }, [initial]);

  function set<K extends keyof SkuMasterFormValues>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        skuErpCode: values.skuErpCode.trim(),
        name: values.name.trim(),
        eanCode: values.eanCode.trim() || null,
        hsnCode: values.hsnCode.trim() || null,
        uom: values.uom.trim() || null,
        agreedRate: values.agreedRate ? Number(values.agreedRate) : null,
        mrp: values.mrp ? Number(values.mrp) : null,
        priceTolerance: values.priceTolerance ? Number(values.priceTolerance) : 0.05,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const errorMessage =
    error instanceof ApiClientError
      ? `${error.message}${error.details ? `: ${JSON.stringify(error.details)}` : ''}`
      : error
      ? 'Something went wrong'
      : null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <Field label="ERP Code *" value={values.skuErpCode} onChange={(v) => set('skuErpCode', v)} />
      <Field label="Name *" value={values.name} onChange={(v) => set('name', v)} />
      <Field label="EAN Code" value={values.eanCode} onChange={(v) => set('eanCode', v)} />
      <Field label="HSN Code" value={values.hsnCode} onChange={(v) => set('hsnCode', v)} />
      <Field label="UOM" value={values.uom} onChange={(v) => set('uom', v)} />
      <Field label="Agreed Rate" value={values.agreedRate} onChange={(v) => set('agreedRate', v)} type="number" />
      <Field label="MRP" value={values.mrp} onChange={(v) => set('mrp', v)} type="number" />
      <Field
        label="Price Tolerance (e.g. 0.05)"
        value={values.priceTolerance}
        onChange={(v) => set('priceTolerance', v)}
        type="number"
      />

      {errorMessage && <p className="col-span-2 text-sm text-red-600">{errorMessage}</p>}

      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
