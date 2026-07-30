'use client';

import type { MatchItem } from '@/types/api';
import { Badge } from '@/components/ui/Badge';

function fmtNum(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MismatchCell({ value, flagged }: { value: ReactNodeLike; flagged: boolean }) {
  if (!flagged) return <td className="px-4 py-3 text-right tabular-nums text-gray-700">{value}</td>;
  return (
    <td className="px-4 py-3 text-right">
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 tabular-nums font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        {value}
      </span>
    </td>
  );
}

type ReactNodeLike = string | number;

export function ItemGrid({ items }: { items: MatchItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="themed-scroll max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">SKU Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">SKU ID</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">Mapped SKU Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">ERP Code</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">EAN</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">HSN</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">UOM</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">PO Qty</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">GRN Qty</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Invoice Qty</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Unit Price</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Unit MRP</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Gross Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => {
              const isUnmapped = item.reasons.includes('unmapped_master_sku');
              const hasPriceMismatch = item.reasons.includes('price_mismatch');
              const hasMrpMismatch = item.reasons.includes('mrp_mismatch');
              const hasQtyIssue = item.reasons.some((r) => r.includes('qty_exceeds') || r === 'item_missing_in_po');

              return (
                <tr key={item.key} className={`transition-colors ${isUnmapped ? 'bg-amber-50/50' : 'hover:bg-gray-50/70'}`}>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-800">{item.description || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.itemCode}</td>
                  <td className="px-4 py-3">
                    {item.skuMaster?.name ?? <Badge tone="amber">Unmapped</Badge>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.skuErpCode ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.eanCode ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.hsnCode ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.skuMaster?.uom ?? '—'}</td>
                  <MismatchCell value={fmtNum(item.poQty)} flagged={hasQtyIssue} />
                  <MismatchCell value={fmtNum(item.grnQty)} flagged={hasQtyIssue} />
                  <MismatchCell value={fmtNum(item.invoiceQty)} flagged={hasQtyIssue} />
                  <MismatchCell value={fmtMoney(item.unitRate)} flagged={hasPriceMismatch} />
                  <MismatchCell value={fmtMoney(item.mrp)} flagged={hasMrpMismatch} />
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {item.grossAmount != null ? fmtMoney(item.grossAmount) : '—'}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-sm text-gray-400">
                  No items to display yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
