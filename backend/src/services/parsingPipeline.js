const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const MatchAudit = require('../models/MatchAudit');
const ApiError = require('../utils/ApiError');
const { extractDocument } = require('./extraction');
const { validateExtracted } = require('./validateExtracted');
const { resolveItemMasters } = require('./masterResolution');

// How the extracted JSON's header fields map onto each Mongoose model, and
// which field on that model uniquely identifies the document within a PO
// (used by the duplication check).
const CONFIG = {
  po: {
    Model: PurchaseOrder,
    numberField: 'poNumber',
    dateField: 'poDate',
    buildHeader: (data) => ({ poNumber: data.poNumber, poDate: new Date(data.poDate), vendorName: data.vendorName }),
    buildItem: (item) => ({ itemCode: item.itemCode, description: item.description, quantity: item.quantity }),
  },
  grn: {
    Model: Grn,
    numberField: 'grnNumber',
    dateField: 'grnDate',
    buildHeader: (data) => ({ grnNumber: data.grnNumber, poNumber: data.poNumber, grnDate: new Date(data.grnDate) }),
    buildItem: (item) => ({
      itemCode: item.itemCode,
      description: item.description,
      receivedQuantity: item.receivedQuantity,
      mrp: item.mrp ?? null,
    }),
  },
  invoice: {
    Model: Invoice,
    numberField: 'invoiceNumber',
    dateField: 'invoiceDate',
    buildHeader: (data) => ({
      invoiceNumber: data.invoiceNumber,
      poNumber: data.poNumber,
      invoiceDate: new Date(data.invoiceDate),
    }),
    buildItem: (item) => ({
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitRate: item.unitRate ?? null,
      mrp: item.mrp ?? null,
    }),
  },
};

async function appendAudit(poNumber, steps) {
  await MatchAudit.create({ poNumber, steps });
}

/**
 * Runs the full upload pipeline as a sequence of plain functions - no
 * engine/plugin abstraction, per the assignment's scope guidance:
 *   extract -> validate (retry once inside extractDocument) -> resolve
 *   masters -> persist -> duplicate check -> audit log.
 * Documents are always persisted independently of whether a PO already
 * exists for that poNumber (upload order must not matter).
 */
async function runUploadPipeline({ file, documentType }) {
  const config = CONFIG[documentType];
  if (!config) {
    throw new ApiError(400, `Invalid documentType "${documentType}". Must be one of po, grn, invoice.`);
  }

  const auditSteps = [];
  let poNumberForAudit = null;

  try {
    const rawParsed = await extractDocument({
      filePath: file.path,
      mimeType: file.mimetype,
      documentType,
    });
    auditSteps.push({ step: 'extract', status: 'ok', message: 'Gemini extraction succeeded' });

    validateExtracted(documentType, rawParsed);
    auditSteps.push({ step: 'validate', status: 'ok', message: 'Extracted JSON passed validation' });

    poNumberForAudit = rawParsed.poNumber;

    const { items: resolvedItems, unmappedCount } = await resolveItemMasters(
      rawParsed.items.map(config.buildItem)
    );
    auditSteps.push({
      step: 'resolve_masters',
      status: unmappedCount > 0 ? 'warning' : 'ok',
      message: unmappedCount > 0 ? `${unmappedCount} item(s) could not be resolved to a SkuMaster` : 'All items resolved',
    });

    const doc = await config.Model.create({
      ...config.buildHeader(rawParsed),
      items: resolvedItems,
      rawParsed,
      file: { filePath: file.path, originalName: file.originalname, mimeType: file.mimetype },
    });
    auditSteps.push({ step: 'persist', status: 'ok', message: `${documentType} persisted with id ${doc._id}` });

    const duplicate = await runDuplicationCheck(documentType, config, doc);
    if (duplicate.isDuplicate) {
      auditSteps.push({ step: 'duplicate_check', status: 'warning', message: duplicate.reasonCode });
    } else {
      auditSteps.push({ step: 'duplicate_check', status: 'ok', message: 'No duplicate detected' });
    }

    await appendAudit(doc.poNumber, auditSteps);

    return { doc, documentType, warnings: unmappedCount > 0 ? ['unmapped_master_sku'] : [], duplicate };
  } catch (err) {
    auditSteps.push({ step: 'pipeline_failed', status: 'error', message: err.message });
    if (poNumberForAudit) {
      await appendAudit(poNumberForAudit, auditSteps).catch(() => {});
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(422, `Failed to parse ${documentType}: ${err.message}`);
  }
}

/**
 * Runs right after persistence per spec: a second PO for a poNumber that
 * already has one -> duplicate_po (stored anyway). A second GRN/Invoice
 * reusing a grnNumber/invoiceNumber under the same poNumber -> duplicate_document.
 */
async function runDuplicationCheck(documentType, config, savedDoc) {
  if (documentType === 'po') {
    const existingCount = await config.Model.countDocuments({
      poNumber: savedDoc.poNumber,
      _id: { $ne: savedDoc._id },
    });
    return existingCount > 0 ? { isDuplicate: true, reasonCode: 'duplicate_po' } : { isDuplicate: false };
  }

  const numberField = config.numberField;
  const existingCount = await config.Model.countDocuments({
    poNumber: savedDoc.poNumber,
    [numberField]: savedDoc[numberField],
    _id: { $ne: savedDoc._id },
  });
  return existingCount > 0 ? { isDuplicate: true, reasonCode: 'duplicate_document' } : { isDuplicate: false };
}

module.exports = { runUploadPipeline };
