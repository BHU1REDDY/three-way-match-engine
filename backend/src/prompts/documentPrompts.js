const BASE_INSTRUCTIONS = `You are a document data-extraction engine for a procurement system.
You will be shown a scanned/PDF business document. Extract the requested fields and return
ONLY a single valid JSON object - no markdown fences, no commentary, no trailing text.
If a field is not visible on the document, use null (for scalars) or an empty array (for items).
Dates must be returned as ISO 8601 strings (YYYY-MM-DD). Numbers must be plain JSON numbers,
not strings, and must not include currency symbols or thousands separators.
"itemCode" for each line item must be the vendor/ERP/SKU code printed on that line (not the
row/serial number). Every line item on the document must appear in the items array, aggregated
per printed row.`;

const PROMPTS = {
  po: `${BASE_INSTRUCTIONS}

Document type: PURCHASE ORDER (PO).
Return JSON with this exact shape:
{
  "poNumber": string,
  "poDate": string (ISO date),
  "vendorName": string,
  "items": [
    { "itemCode": string, "description": string, "quantity": number }
  ]
}`,

  grn: `${BASE_INSTRUCTIONS}

Document type: GOODS RECEIPT NOTE (GRN).
Return JSON with this exact shape:
{
  "grnNumber": string,
  "poNumber": string,
  "grnDate": string (ISO date),
  "items": [
    { "itemCode": string, "description": string, "receivedQuantity": number, "mrp": number|null }
  ]
}`,

  invoice: `${BASE_INSTRUCTIONS}

Document type: VENDOR INVOICE.
Return JSON with this exact shape:
{
  "invoiceNumber": string,
  "poNumber": string,
  "invoiceDate": string (ISO date),
  "items": [
    { "itemCode": string, "description": string, "quantity": number, "unitRate": number|null, "mrp": number|null }
  ]
}
"poNumber" on an invoice is usually labelled "Customer Order No." or "PO No.".`,
};

function getPromptFor(documentType) {
  const prompt = PROMPTS[documentType];
  if (!prompt) {
    throw new Error(`No extraction prompt configured for documentType "${documentType}"`);
  }
  return prompt;
}

module.exports = { getPromptFor };
