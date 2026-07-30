'use client';

import type { SummaryRow } from '@/types/api';

const STATUS_LABEL: Record<string, string> = {
  matched: 'Matched',
  partially_matched: 'Partially Matched',
  mismatch: 'Mismatch',
  insufficient_documents: 'Insufficient Documents',
};

export function AssociatedTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">Document</th>
            <th className="px-3 py-2 text-left">Number</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Cumulative Received</th>
            <th className="px-3 py-2 text-right">Cumulative Invoiced</th>
            <th className="px-3 py-2 text-right">Pending Delivery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, idx) => {
            const isStatusRow = row.documentType === 'current_status';
            return (
              <tr key={idx} className={isStatusRow ? 'bg-gray-50 font-medium' : ''}>
                <td className="px-3 py-2 capitalize">
                  {isStatusRow ? 'Current Status' : row.documentType}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.documentNumber ?? '—'}</td>
                <td className="px-3 py-2">{row.date ? new Date(row.date).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2 text-right">{row.qty ?? '—'}</td>
                <td className="px-3 py-2 text-right">{row.cumulativeReceivedQty}</td>
                <td className="px-3 py-2 text-right">{row.cumulativeInvoicedQty}</td>
                <td className="px-3 py-2 text-right">
                  {isStatusRow && row.status ? (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                      {STATUS_LABEL[row.status]}
                    </span>
                  ) : (
                    row.pendingDeliveryQty
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
