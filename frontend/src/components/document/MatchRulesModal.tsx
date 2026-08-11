'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';

const HARD_RULES = [
  { code: 'grn_qty_exceeds_po_qty', desc: "The warehouse received more of an item than was ever ordered on the PO." },
  { code: 'invoice_qty_exceeds_grn_qty', desc: "The vendor is billing for more than what's actually been received so far." },
  { code: 'invoice_qty_exceeds_po_qty', desc: 'The vendor is billing for more than was ordered, period.' },
  { code: 'invoice_date_after_po_date', desc: 'The invoice is dated after the PO date — unusual, worth a second look.' },
  { code: 'duplicate_po', desc: 'A second PO was uploaded for the same PO number. Both are kept, not overwritten.' },
  { code: 'duplicate_document', desc: 'Two GRNs (or two Invoices) share the same document number under this PO.' },
  { code: 'item_missing_in_po', desc: 'An item on the GRN/Invoice has no matching line on the PO at all.' },
];

const SOFT_RULES = [
  {
    code: 'price_mismatch',
    desc: "The invoice's billed rate differs from the agreed rate in SKU Master by more than the allowed tolerance (5% by default).",
  },
  {
    code: 'mrp_mismatch',
    desc: "The MRP on the invoice/GRN differs from the SKU Master's catalogue MRP by more than ~1%.",
  },
  {
    code: 'unmapped_master_sku',
    desc: "An item's code couldn't be matched to any SKU Master record.",
  },
];

function CodeChip({ code }: { code: string }) {
  return <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">{code}</code>;
}

export function MatchRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="themed-scroll max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">How matching works</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">The 4 possible statuses</h3>
            <p className="mb-3 text-sm text-gray-500">
              Checked in this order — worse problems override better ones:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="insufficient_documents" />
              <span className="text-gray-300">→</span>
              <StatusBadge status="mismatch" />
              <span className="text-gray-300">→</span>
              <StatusBadge status="partially_matched" />
              <span className="text-gray-300">→</span>
              <StatusBadge status="matched" />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li>
                <strong className="font-medium text-gray-800">Insufficient Documents</strong> — still missing the
                PO, GRN, or Invoice entirely. Nothing gets compared yet.
              </li>
              <li>
                <strong className="font-medium text-gray-800">Mismatch</strong> — at least one hard violation below
                was found. Something is seriously wrong.
              </li>
              <li>
                <strong className="font-medium text-gray-800">Partially Matched</strong> — no hard violations, but a
                soft warning exists, or quantities just haven&apos;t fully reconciled yet (e.g. a partial delivery
                — no flag shows for this, it just means every line isn&apos;t equal across all three documents
                yet).
              </li>
              <li>
                <strong className="font-medium text-gray-800">Matched</strong> — everything lines up perfectly, no
                flags at all.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Hard violations <span className="font-normal text-gray-400">— any one of these means Mismatch</span>
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              Things that shouldn&apos;t happen in a healthy process — billed for or received more than they
              should have, or a genuine data conflict.
            </p>
            <div className="space-y-2.5">
              {HARD_RULES.map((r) => (
                <div key={r.code} className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                  <CodeChip code={r.code} />
                  <p className="mt-1 text-sm text-gray-700">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Soft warnings{' '}
              <span className="font-normal text-gray-400">— only matter if no hard violation exists</span>
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              Worth a human glance, but don&apos;t block anything on their own.
            </p>
            <div className="space-y-2.5">
              {SOFT_RULES.map((r) => (
                <div key={r.code} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <CodeChip code={r.code} />
                  <p className="mt-1 text-sm text-gray-700">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
