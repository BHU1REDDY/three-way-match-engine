'use client';

import type { MatchStatus } from '@/types/api';

const REASON_LABELS: Record<string, string> = {
  grn_qty_exceeds_po_qty: 'Received Qty Exceeds PO Qty',
  invoice_qty_exceeds_grn_qty: 'Invoiced Qty Exceeds Received Qty',
  invoice_qty_exceeds_po_qty: 'Invoiced Qty Exceeds PO Qty',
  invoice_date_after_po_date: 'Invoice Date After PO Date',
  duplicate_po: 'Duplicate PO',
  duplicate_document: 'Duplicate Document',
  item_missing_in_po: 'Item Missing In PO',
  price_mismatch: 'Price Mismatch',
  mrp_mismatch: 'MRP Mismatch',
  unmapped_master_sku: 'Unmapped SKU',
};

const STATUS_STYLE: Record<MatchStatus, { bg: string; text: string; label: string }> = {
  matched: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', label: 'Matched' },
  partially_matched: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    label: 'Partially Matched',
  },
  mismatch: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', label: 'Mismatch' },
  insufficient_documents: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    label: 'Insufficient Documents',
  },
};

export function MismatchBanner({ status, reasons }: { status: MatchStatus; reasons: string[] }) {
  if (status === 'matched') return null;
  const style = STATUS_STYLE[status];

  return (
    <div className={`rounded-lg border p-3 ${style.bg}`}>
      <p className={`text-sm font-semibold ${style.text}`}>{style.label}</p>
      {reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <span
              key={r}
              className="rounded-full border border-current/20 bg-white px-2 py-0.5 text-xs font-medium text-gray-700"
            >
              {REASON_LABELS[r] || r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { REASON_LABELS };
