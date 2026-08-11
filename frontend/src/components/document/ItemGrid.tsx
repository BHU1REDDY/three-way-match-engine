'use client';

import type { MatchItem } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';

function fmtNum(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type ReactNodeLike = string | number;

function MismatchCell({ value, flagged, tooltip }: { value: ReactNodeLike; flagged: boolean; tooltip?: string }) {
  if (!flagged) return <td className="px-4 py-3 text-right tabular-nums text-gray-700">{value}</td>;
  const chip = (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 tabular-nums font-semibold text-red-700 ring-1 ring-inset ring-red-200">
      {value}
    </span>
  );
  return (
    <td className="px-4 py-3 text-right">
      {tooltip ? <Tooltip content={tooltip}>{chip}</Tooltip> : chip}
    </td>
  );
}

function Th({ label, tip, align = 'left' }: { label: string; tip: string; align?: 'left' | 'right' }) {
  return (
    <th className={`whitespace-nowrap px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <Tooltip content={tip}>
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          <InfoIcon className="text-gray-300" />
        </span>
      </Tooltip>
    </th>
  );
}

export function ItemGrid({ items }: { items: MatchItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="themed-scroll max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
            <tr>
              <Th label="SKU Name" tip="The item description exactly as printed on this document." />
              <Th label="SKU ID" tip="The raw item/vendor code exactly as printed on this document." />
              <Th
                label="Mapped SKU Name"
                tip="The catalogue product this code was matched to in SKU Master. Shows “Unmapped” when no match was found — the code didn't exist in the catalogue."
              />
              <Th label="ERP Code" tip="SKU Master's own code for the matched product." />
              <Th label="EAN" tip="SKU Master's alternate code — used as a fallback match when ERP Code doesn't match." />
              <Th label="HSN" tip="Tax classification code for the matched product (from SKU Master), for reference only." />
              <Th label="UOM" tip="Unit of measure for the matched product (e.g. PKT, KG), for reference only." />
              <Th
                label="PO Qty"
                tip="Quantity ordered on the Purchase Order. Shows “Not on PO” when this item never appeared on the PO at all."
                align="right"
              />
              <Th label="GRN Qty" tip="Quantity actually received, from the GRN (Goods Receipt Note)." align="right" />
              <Th label="Invoice Qty" tip="Quantity being billed, from the Invoice." align="right" />
              <Th
                label="Unit Price"
                tip="Rate billed on the Invoice. Highlighted red when it differs from SKU Master's agreed rate by more than the allowed tolerance."
                align="right"
              />
              <Th
                label="Unit MRP"
                tip="MRP shown on the Invoice/GRN. Highlighted red when it differs from SKU Master's MRP by more than ~1%."
                align="right"
              />
              <Th label="Gross Amount" tip="Invoice quantity × Unit Price." align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => {
              const isUnmapped = item.reasons.includes('unmapped_master_sku');
              const isMissingFromPo = item.reasons.includes('item_missing_in_po');
              const hasPriceMismatch = item.reasons.includes('price_mismatch');
              const hasMrpMismatch = item.reasons.includes('mrp_mismatch');
              const hasQtyExceeds = item.reasons.some((r) => r.includes('qty_exceeds'));
              const hasQtyIssue = hasQtyExceeds || isMissingFromPo;

              return (
                <tr key={item.key} className={`transition-colors ${isUnmapped ? 'bg-amber-50/50' : 'hover:bg-gray-50/70'}`}>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-800">{item.description || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.itemCode}</td>
                  <td className="px-4 py-3">
                    {item.skuMaster?.name ?? (
                      <Tooltip content="This item's code doesn't match any SKU Master record (by ERP Code or EAN) — add one on the SKU Master screen to resolve it.">
                        <Badge tone="amber">Unmapped</Badge>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.skuErpCode ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.eanCode ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuMaster?.hsnCode ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.skuMaster?.uom ?? '—'}</td>
                  {item.poQty == null ? (
                    <td className="px-4 py-3 text-right">
                      <Tooltip content="This item appears on a GRN or Invoice for this PO, but there's no matching line item on the Purchase Order itself.">
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                          Not on PO
                        </span>
                      </Tooltip>
                    </td>
                  ) : (
                    <MismatchCell value={fmtNum(item.poQty)} flagged={hasQtyExceeds} tooltip="This quantity exceeds what's allowed at the next stage." />
                  )}
                  <MismatchCell
                    value={fmtNum(item.grnQty)}
                    flagged={hasQtyIssue}
                    tooltip={isMissingFromPo ? "Received/billed for an item that isn't on the PO." : 'Received quantity exceeds what was ordered/invoiced.'}
                  />
                  <MismatchCell
                    value={fmtNum(item.invoiceQty)}
                    flagged={hasQtyIssue}
                    tooltip={isMissingFromPo ? "Billed for an item that isn't on the PO." : 'Invoiced quantity exceeds what was ordered/received.'}
                  />
                  <MismatchCell
                    value={fmtMoney(item.unitRate)}
                    flagged={hasPriceMismatch}
                    tooltip="Differs from SKU Master's agreed rate by more than the allowed tolerance."
                  />
                  <MismatchCell
                    value={fmtMoney(item.mrp)}
                    flagged={hasMrpMismatch}
                    tooltip="Differs from SKU Master's catalogue MRP by more than ~1%."
                  />
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-red-200 bg-red-50" />
          value doesn&apos;t reconcile — hover it for why
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-100" />
          row&apos;s SKU code isn&apos;t in the catalogue yet
        </span>
      </div>
    </div>
  );
}
