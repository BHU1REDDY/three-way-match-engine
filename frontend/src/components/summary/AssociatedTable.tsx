'use client';

import type { SummaryRow } from '@/types/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';

const DOC_TYPE_TONE: Record<string, 'indigo' | 'emerald' | 'purple'> = {
  grn: 'emerald',
  invoice: 'purple',
};

export function AssociatedTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Associated Invoice &amp; GRN</h3>
      </div>
      <div className="themed-scroll overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-2.5 text-left">Document</th>
              <th className="px-5 py-2.5 text-left">Number</th>
              <th className="px-5 py-2.5 text-left">Date</th>
              <th className="px-5 py-2.5 text-right">Qty</th>
              <th className="px-5 py-2.5 text-right">Cumulative Received</th>
              <th className="px-5 py-2.5 text-right">Cumulative Invoiced</th>
              <th className="px-5 py-2.5 text-right">Pending Delivery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, idx) => {
              const isStatusRow = row.documentType === 'current_status';
              return (
                <tr key={idx} className={isStatusRow ? 'bg-gray-50/70' : 'hover:bg-gray-50/60'}>
                  <td className="px-5 py-3">
                    {isStatusRow ? (
                      <span className="font-semibold text-gray-700">Current Status</span>
                    ) : (
                      <Badge tone={DOC_TYPE_TONE[row.documentType] ?? 'gray'} className="capitalize">
                        {row.documentType}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{row.documentNumber ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-700">{row.qty ?? '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900">
                    {row.cumulativeReceivedQty}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900">
                    {row.cumulativeInvoicedQty}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isStatusRow && row.status ? (
                      <StatusBadge status={row.status} />
                    ) : (
                      <span className="tabular-nums text-gray-700">{row.pendingDeliveryQty}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
