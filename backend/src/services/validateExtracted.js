const ApiError = require('../utils/ApiError');

const REQUIRED_HEADER_FIELDS = {
  po: ['poNumber', 'poDate', 'vendorName'],
  grn: ['grnNumber', 'poNumber', 'grnDate'],
  invoice: ['invoiceNumber', 'poNumber', 'invoiceDate'],
};

const REQUIRED_ITEM_FIELDS = {
  po: ['itemCode', 'description', 'quantity'],
  grn: ['itemCode', 'description', 'receivedQuantity'],
  invoice: ['itemCode', 'description', 'quantity'],
};

/**
 * Validates Gemini's (or the mock's) output has the minimum fields the spec
 * requires before anything is persisted. Treats the extracted JSON as
 * untrusted input - throws a 422 ApiError on the first structural problem
 * found rather than silently coercing or dropping data.
 */
function validateExtracted(documentType, data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError(422, 'Gemini did not return a JSON object');
  }

  for (const field of REQUIRED_HEADER_FIELDS[documentType]) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new ApiError(422, `Extracted document is missing required field "${field}"`);
    }
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ApiError(422, 'Extracted document has no line items');
  }

  const requiredItemFields = REQUIRED_ITEM_FIELDS[documentType];
  data.items.forEach((item, idx) => {
    for (const field of requiredItemFields) {
      if (item[field] === undefined || item[field] === null || item[field] === '') {
        throw new ApiError(422, `Item ${idx + 1} is missing required field "${field}"`);
      }
    }
    const qtyField = documentType === 'grn' ? 'receivedQuantity' : 'quantity';
    if (typeof item[qtyField] !== 'number' || Number.isNaN(item[qtyField])) {
      throw new ApiError(422, `Item ${idx + 1} has a non-numeric ${qtyField}`);
    }
  });

  const dateField = { po: 'poDate', grn: 'grnDate', invoice: 'invoiceDate' }[documentType];
  if (Number.isNaN(Date.parse(data[dateField]))) {
    throw new ApiError(422, `"${dateField}" is not a valid date`);
  }
}

module.exports = { validateExtracted };
