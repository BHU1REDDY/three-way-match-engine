'use client';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StatCards({
  poAmount,
  totalInvoiced,
  totalReceived,
}: {
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
}) {
  const cards = [
    { label: 'PO Amount', value: poAmount, color: 'text-indigo-600' },
    { label: 'Total Invoiced', value: totalInvoiced, color: 'text-purple-600' },
    { label: 'Total Received', value: totalReceived, color: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{formatCurrency(c.value)}</p>
        </div>
      ))}
    </div>
  );
}
