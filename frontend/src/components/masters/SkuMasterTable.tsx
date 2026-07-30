'use client';

import type { SkuMaster } from '@/types/api';

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  );
}

export function SkuMasterTable({
  skus,
  onEdit,
  onDelete,
}: {
  skus: SkuMaster[];
  onEdit: (sku: SkuMaster) => void;
  onDelete: (sku: SkuMaster) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="themed-scroll overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">ERP Code</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">EAN</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">HSN</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">UOM</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Agreed Rate</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">MRP</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Tolerance</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {skus.map((sku) => (
              <tr key={sku._id} className="transition-colors hover:bg-gray-50/70">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{sku.skuErpCode}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{sku.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{sku.eanCode ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{sku.hsnCode ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{sku.uom ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{sku.agreedRate ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{sku.mrp ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">{sku.priceTolerance}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(sku)}
                      title="Edit"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(sku)}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
