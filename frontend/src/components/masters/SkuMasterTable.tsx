'use client';

import type { SkuMaster } from '@/types/api';

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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">ERP Code</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">EAN</th>
            <th className="px-3 py-2 text-left">HSN</th>
            <th className="px-3 py-2 text-left">UOM</th>
            <th className="px-3 py-2 text-right">Agreed Rate</th>
            <th className="px-3 py-2 text-right">MRP</th>
            <th className="px-3 py-2 text-right">Tolerance</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {skus.map((sku) => (
            <tr key={sku._id}>
              <td className="px-3 py-2 font-mono text-xs">{sku.skuErpCode}</td>
              <td className="px-3 py-2">{sku.name}</td>
              <td className="px-3 py-2 font-mono text-xs">{sku.eanCode ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-xs">{sku.hsnCode ?? '—'}</td>
              <td className="px-3 py-2">{sku.uom ?? '—'}</td>
              <td className="px-3 py-2 text-right">{sku.agreedRate ?? '—'}</td>
              <td className="px-3 py-2 text-right">{sku.mrp ?? '—'}</td>
              <td className="px-3 py-2 text-right">{sku.priceTolerance}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => onEdit(sku)} className="mr-2 text-xs text-blue-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => onDelete(sku)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {skus.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-gray-400">
                No SKU Master records yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
