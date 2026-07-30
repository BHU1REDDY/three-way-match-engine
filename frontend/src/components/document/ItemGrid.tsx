'use client';

import type { MatchItem } from '@/types/api';

function cellClass(hasIssue: boolean) {
  return hasIssue ? 'bg-red-50 text-red-700 font-medium' : '';
}

export function ItemGrid({ items }: { items: MatchItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">SKU Name</th>
            <th className="px-3 py-2 text-left">SKU ID</th>
            <th className="px-3 py-2 text-left">Mapped SKU Name</th>
            <th className="px-3 py-2 text-left">ERP Code</th>
            <th className="px-3 py-2 text-left">EAN</th>
            <th className="px-3 py-2 text-left">HSN</th>
            <th className="px-3 py-2 text-left">UOM</th>
            <th className="px-3 py-2 text-right">PO Qty</th>
            <th className="px-3 py-2 text-right">GRN Qty</th>
            <th className="px-3 py-2 text-right">Invoice Qty</th>
            <th className="px-3 py-2 text-right">Unit Price</th>
            <th className="px-3 py-2 text-right">Unit MRP</th>
            <th className="px-3 py-2 text-right">Gross Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item) => {
            const isUnmapped = item.reasons.includes('unmapped_master_sku');
            const hasPriceMismatch = item.reasons.includes('price_mismatch');
            const hasMrpMismatch = item.reasons.includes('mrp_mismatch');
            const hasQtyIssue = item.reasons.some((r) => r.includes('qty_exceeds') || r === 'item_missing_in_po');

            return (
              <tr key={item.key} className={isUnmapped ? 'bg-amber-50/60' : ''}>
                <td className="px-3 py-2">{item.description || '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.itemCode}</td>
                <td className="px-3 py-2">
                  {item.skuMaster?.name ?? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      Unmapped
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{item.skuMaster?.skuErpCode ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs">{item.skuMaster?.eanCode ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs">{item.skuMaster?.hsnCode ?? '—'}</td>
                <td className="px-3 py-2">{item.skuMaster?.uom ?? '—'}</td>
                <td className={`px-3 py-2 text-right ${cellClass(hasQtyIssue)}`}>{item.poQty ?? '—'}</td>
                <td className={`px-3 py-2 text-right ${cellClass(hasQtyIssue)}`}>{item.grnQty}</td>
                <td className={`px-3 py-2 text-right ${cellClass(hasQtyIssue)}`}>{item.invoiceQty}</td>
                <td className={`px-3 py-2 text-right ${cellClass(hasPriceMismatch)}`}>
                  {item.unitRate != null ? item.unitRate.toFixed(2) : '—'}
                </td>
                <td className={`px-3 py-2 text-right ${cellClass(hasMrpMismatch)}`}>
                  {item.mrp != null ? item.mrp.toFixed(2) : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  {item.grossAmount != null ? item.grossAmount.toFixed(2) : '—'}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={13} className="px-3 py-6 text-center text-gray-400">
                No items to display yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
