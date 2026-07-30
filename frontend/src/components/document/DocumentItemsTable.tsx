'use client';

import { Badge } from '@/components/ui/Badge';

interface Row {
  itemCode: string;
  description: string;
  qty: number;
  rate?: number | null;
  mrp?: number | null;
  unmappedReason: string | null;
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DocumentItemsTable({ rows, qtyLabel }: { rows: Row[]; qtyLabel: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="themed-scroll max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">Item Code</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">Description</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">{qtyLabel}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Rate</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">MRP</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left">Mapping</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, idx) => (
              <tr key={idx} className={`transition-colors ${row.unmappedReason ? 'bg-amber-50/50' : 'hover:bg-gray-50/70'}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.itemCode}</td>
                <td className="max-w-[280px] truncate px-4 py-3 text-gray-800">{row.description || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtMoney(row.rate)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtMoney(row.mrp)}</td>
                <td className="px-4 py-3">
                  {row.unmappedReason ? (
                    <Badge tone="amber">Unmapped</Badge>
                  ) : (
                    <Badge tone="green">Mapped</Badge>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
