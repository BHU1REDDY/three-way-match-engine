'use client';

interface Row {
  itemCode: string;
  description: string;
  qty: number;
  rate?: number | null;
  mrp?: number | null;
  unmappedReason: string | null;
}

export function DocumentItemsTable({ rows, qtyLabel }: { rows: Row[]; qtyLabel: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">Item Code</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-right">{qtyLabel}</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="px-3 py-2 text-right">MRP</th>
            <th className="px-3 py-2 text-left">Mapping</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, idx) => (
            <tr key={idx} className={row.unmappedReason ? 'bg-amber-50/60' : ''}>
              <td className="px-3 py-2 font-mono text-xs">{row.itemCode}</td>
              <td className="px-3 py-2">{row.description || '—'}</td>
              <td className="px-3 py-2 text-right">{row.qty}</td>
              <td className="px-3 py-2 text-right">{row.rate != null ? row.rate.toFixed(2) : '—'}</td>
              <td className="px-3 py-2 text-right">{row.mrp != null ? row.mrp.toFixed(2) : '—'}</td>
              <td className="px-3 py-2">
                {row.unmappedReason ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                    Unmapped
                  </span>
                ) : (
                  <span className="text-xs text-green-600">Mapped</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
