const SkuMaster = require('../models/SkuMaster');
const { normalizeCode } = require('../utils/normalize');

/** Loads every SkuMaster once and indexes by normalized skuErpCode/eanCode. */
async function buildSkuIndex() {
  const all = await SkuMaster.find({}).lean();
  const byErp = new Map();
  const byEan = new Map();

  for (const sku of all) {
    byErp.set(normalizeCode(sku.skuErpCode), sku);
    if (sku.eanCode) byEan.set(normalizeCode(sku.eanCode), sku);
  }

  return { byErp, byEan };
}

/**
 * Resolves a single itemCode against the SKU Master index: skuErpCode first,
 * then eanCode as a fallback lookup key. Never throws - an unresolved item
 * is a soft warning (unmapped_master_sku), not a hard error, per spec.
 */
function resolveItemCode(itemCode, index) {
  const key = normalizeCode(itemCode);
  const sku = index.byErp.get(key) || index.byEan.get(key) || null;

  if (!sku) {
    return { skuMaster: null, unmappedReason: 'unmapped_master_sku' };
  }
  return { skuMaster: sku._id, unmappedReason: null };
}

/**
 * Runs after parsing, before persistence: attaches a resolved SkuMaster ref
 * (or an unmapped_master_sku warning) to every line item. Returns a new
 * items array plus the count of unresolved items for the caller's audit log.
 */
async function resolveItemMasters(items) {
  const index = await buildSkuIndex();
  let unmappedCount = 0;

  const resolved = items.map((item) => {
    const { skuMaster, unmappedReason } = resolveItemCode(item.itemCode, index);
    if (unmappedReason) unmappedCount += 1;
    return { ...item, skuMaster, unmappedReason };
  });

  return { items: resolved, unmappedCount };
}

module.exports = { buildSkuIndex, resolveItemCode, resolveItemMasters };
