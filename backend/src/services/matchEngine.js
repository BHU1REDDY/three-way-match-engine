const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const { normalizeCode } = require('../utils/normalize');
const { buildSkuIndex, resolveItemCode } = require('./masterResolution');

const HARD_REASONS = new Set([
  'grn_qty_exceeds_po_qty',
  'invoice_qty_exceeds_grn_qty',
  'invoice_qty_exceeds_po_qty',
  'invoice_date_after_po_date',
  'duplicate_po',
  'duplicate_document',
  'item_missing_in_po',
]);
const SOFT_REASONS = new Set(['price_mismatch', 'mrp_mismatch', 'unmapped_master_sku']);

/** The matching key for an item: resolved SkuMaster._id if present, else the
 * normalized raw itemCode fallback (spec: "never dropped, stays visible"). */
function keyFor(resolvedSkuId, itemCode) {
  return resolvedSkuId ? `sku:${resolvedSkuId}` : `raw:${normalizeCode(itemCode)}`;
}

function ensureBucket(map, key, itemCode, description) {
  if (!map.has(key)) {
    map.set(key, {
      key,
      skuMasterId: null,
      itemCode,
      description,
      poQty: 0,
      inPo: false,
      grnQty: 0,
      invoiceQty: 0,
      grnMrps: [],
      invoiceLines: [], // { qty, unitRate, mrp }
      unmapped: false,
      reasons: new Set(),
    });
  }
  return map.get(key);
}

/**
 * Pure function: recomputes the three-way match for a poNumber from
 * whatever PO/GRN/Invoice documents currently exist in the DB. Never reads
 * or writes a cached result - always fresh, per spec.
 */
async function computeMatch(poNumber) {
  const [pos, grns, invoices] = await Promise.all([
    PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
  ]);

  const headerReasons = new Set();

  if (pos.length > 1) headerReasons.add('duplicate_po');
  if (hasDuplicateNumbers(grns, 'grnNumber')) headerReasons.add('duplicate_document');
  if (hasDuplicateNumbers(invoices, 'invoiceNumber')) headerReasons.add('duplicate_document');

  // insufficient_documents takes priority over everything else, computed
  // before quantity rules run (missing types are not treated as qty 0).
  if (pos.length === 0 || grns.length === 0 || invoices.length === 0) {
    return {
      poNumber,
      status: 'insufficient_documents',
      reasons: Array.from(headerReasons),
      items: [],
      linkedDocs: { po: pos, grns, invoices },
    };
  }

  const primaryPo = pos[0];
  if (invoices.some((inv) => new Date(inv.invoiceDate) > new Date(primaryPo.poDate))) {
    headerReasons.add('invoice_date_after_po_date');
  }

  // Master resolution is re-run live against the CURRENT SkuMaster
  // catalogue on every match computation - not read from each item's
  // skuMaster field, which was frozen at upload time. Per spec: "if the
  // missing SKU Master record is created later, a recomputed match should
  // pick it up."
  const skuIndex = await buildSkuIndex();
  const skuById = new Map(
    [...skuIndex.byErp.values(), ...skuIndex.byEan.values()].map((s) => [String(s._id), s])
  );

  const buckets = new Map();

  for (const item of primaryPo.items) {
    const { skuMaster, unmappedReason } = resolveItemCode(item.itemCode, skuIndex);
    const key = keyFor(skuMaster, item.itemCode);
    const bucket = ensureBucket(buckets, key, item.itemCode, item.description);
    bucket.poQty += item.quantity;
    bucket.inPo = true;
    if (skuMaster) bucket.skuMasterId = String(skuMaster);
    if (unmappedReason) bucket.unmapped = true;
  }

  for (const grn of grns) {
    for (const item of grn.items) {
      const { skuMaster, unmappedReason } = resolveItemCode(item.itemCode, skuIndex);
      const key = keyFor(skuMaster, item.itemCode);
      const bucket = ensureBucket(buckets, key, item.itemCode, item.description);
      bucket.grnQty += item.receivedQuantity;
      if (item.mrp != null) bucket.grnMrps.push(item.mrp);
      if (skuMaster) bucket.skuMasterId = String(skuMaster);
      if (unmappedReason) bucket.unmapped = true;
    }
  }

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const { skuMaster, unmappedReason } = resolveItemCode(item.itemCode, skuIndex);
      const key = keyFor(skuMaster, item.itemCode);
      const bucket = ensureBucket(buckets, key, item.itemCode, item.description);
      bucket.invoiceQty += item.quantity;
      bucket.invoiceLines.push({ qty: item.quantity, unitRate: item.unitRate, mrp: item.mrp });
      if (skuMaster) bucket.skuMasterId = String(skuMaster);
      if (unmappedReason) bucket.unmapped = true;
    }
  }

  const items = [];
  let notFullyReconciled = false;

  for (const bucket of buckets.values()) {
    const sku = bucket.skuMasterId ? skuById.get(bucket.skuMasterId) : null;

    if (!bucket.inPo) {
      bucket.reasons.add('item_missing_in_po');
    } else {
      if (bucket.grnQty > bucket.poQty) bucket.reasons.add('grn_qty_exceeds_po_qty');
      if (bucket.invoiceQty > bucket.grnQty) bucket.reasons.add('invoice_qty_exceeds_grn_qty');
      if (bucket.invoiceQty > bucket.poQty) bucket.reasons.add('invoice_qty_exceeds_po_qty');
      if (bucket.invoiceQty !== bucket.poQty || bucket.grnQty !== bucket.poQty) {
        notFullyReconciled = true;
      }
    }

    if (bucket.unmapped) bucket.reasons.add('unmapped_master_sku');

    if (sku && sku.agreedRate && sku.agreedRate > 0) {
      const tolerance = sku.priceTolerance ?? 0.05;
      const priceMismatch = bucket.invoiceLines.some((line) => {
        if (line.unitRate == null) return false;
        return Math.abs(line.unitRate - sku.agreedRate) / sku.agreedRate > tolerance;
      });
      if (priceMismatch) bucket.reasons.add('price_mismatch');
    }

    if (sku && sku.mrp && sku.mrp > 0) {
      const mrpValues = [...bucket.grnMrps, ...bucket.invoiceLines.map((l) => l.mrp)].filter(
        (v) => v != null
      );
      const mrpMismatch = mrpValues.some((v) => Math.abs(v - sku.mrp) / sku.mrp > 0.01);
      if (mrpMismatch) bucket.reasons.add('mrp_mismatch');
    }

    const invoiceRate = bucket.invoiceLines.find((l) => l.unitRate != null)?.unitRate ?? null;
    const invoiceMrp = bucket.invoiceLines.find((l) => l.mrp != null)?.mrp ?? bucket.grnMrps[0] ?? null;

    items.push({
      key: bucket.key,
      itemCode: bucket.itemCode,
      description: bucket.description,
      skuMaster: sku
        ? {
            _id: sku._id,
            skuErpCode: sku.skuErpCode,
            name: sku.name,
            eanCode: sku.eanCode,
            hsnCode: sku.hsnCode,
            uom: sku.uom,
            agreedRate: sku.agreedRate,
            mrp: sku.mrp,
          }
        : null,
      poQty: bucket.inPo ? bucket.poQty : null,
      grnQty: bucket.grnQty,
      invoiceQty: bucket.invoiceQty,
      unitRate: invoiceRate,
      mrp: invoiceMrp,
      grossAmount: invoiceRate != null ? invoiceRate * bucket.invoiceQty : null,
      reasons: Array.from(bucket.reasons),
    });

    bucket.reasons.forEach((r) => headerReasons.add(r));
  }

  const reasons = Array.from(headerReasons);
  const status = deriveStatus(reasons, notFullyReconciled);

  return {
    poNumber,
    status,
    reasons,
    items,
    linkedDocs: { po: pos, grns, invoices },
  };
}

function hasDuplicateNumbers(docs, field) {
  const seen = new Set();
  for (const doc of docs) {
    if (seen.has(doc[field])) return true;
    seen.add(doc[field]);
  }
  return false;
}

function deriveStatus(reasons, notFullyReconciled) {
  if (reasons.some((r) => HARD_REASONS.has(r))) return 'mismatch';
  if (notFullyReconciled || reasons.some((r) => SOFT_REASONS.has(r))) return 'partially_matched';
  return 'matched';
}

module.exports = { computeMatch };
