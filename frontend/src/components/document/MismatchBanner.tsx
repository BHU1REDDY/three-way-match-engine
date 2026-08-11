'use client';

import type { MatchStatus } from '@/types/api';
import { Tooltip } from '@/components/ui/Tooltip';

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

const REASON_DESCRIPTIONS: Record<string, string> = {
  grn_qty_exceeds_po_qty: 'More was received on a GRN than was ever ordered on the PO for at least one item.',
  invoice_qty_exceeds_grn_qty: "The invoice bills for more than what's been received so far, for at least one item.",
  invoice_qty_exceeds_po_qty: 'The invoice bills for more than was ordered on the PO, for at least one item.',
  invoice_date_after_po_date: 'At least one invoice is dated after the PO date — unusual, worth double-checking.',
  duplicate_po: 'A second PO was uploaded for this same PO number. Both are kept, not overwritten.',
  duplicate_document: 'Two GRNs (or two Invoices) share the same document number under this PO.',
  item_missing_in_po: "At least one item on a GRN/Invoice has no matching line on the PO itself — see the item grid's “Not on PO” tags below.",
  price_mismatch: "An invoice's billed rate differs from the agreed SKU Master rate by more than the allowed tolerance.",
  mrp_mismatch: 'An MRP on the invoice/GRN differs from the SKU Master catalogue MRP by more than ~1%.',
  unmapped_master_sku: "At least one item's code couldn't be matched to any SKU Master record — see the amber rows below.",
};

const STATUS_STYLE: Record<
  MatchStatus,
  { bg: string; border: string; text: string; iconBg: string; iconText: string; label: string; description: string }
> = {
  matched: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    label: 'Matched',
    description: 'All quantities and prices reconcile across PO, GRN, and Invoice.',
  },
  partially_matched: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    label: 'Partially Matched',
    description: 'No hard violations, but some quantities or prices need a second look.',
  },
  mismatch: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    label: 'Mismatch',
    description: 'One or more hard violations were found across these documents.',
  },
  insufficient_documents: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    iconBg: 'bg-gray-200',
    iconText: 'text-gray-500',
    label: 'Insufficient Documents',
    description: 'Waiting on the full PO + GRN + Invoice set before a match can be computed.',
  },
};

function StatusIcon({ status, className }: { status: MatchStatus; className?: string }) {
  if (status === 'matched') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (status === 'insufficient_documents') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function MismatchBanner({ status, reasons }: { status: MatchStatus; reasons: string[] }) {
  if (status === 'matched') return null;
  const style = STATUS_STYLE[status];

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}>
          <StatusIcon status={status} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${style.text}`}>{style.label}</p>
          <p className="mt-0.5 text-xs text-gray-500">{style.description}</p>
          {reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <Tooltip key={r} content={REASON_DESCRIPTIONS[r] ?? 'See the item grid below for details.'}>
                  <span className="cursor-help rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                    {REASON_LABELS[r] || r}
                  </span>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { REASON_LABELS };
