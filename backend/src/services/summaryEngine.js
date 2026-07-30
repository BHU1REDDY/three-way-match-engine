const { computeMatch } = require('./matchEngine');

/**
 * Builds the GET /summary/:poNumber payload from computeMatch's output -
 * no separate persistence, always derived live.
 *
 * Valuation note (documented in README "Assumptions"): PO/GRN line items
 * don't carry a price in the minimal extraction schema, so PO Amount and
 * Total Received are valued at the resolved SkuMaster.agreedRate (0 when
 * unresolved). Total Invoiced uses the invoice's own billed unitRate, which
 * is the one real monetary figure the documents actually carry.
 */
async function buildSummary(poNumber) {
  const match = await computeMatch(poNumber);

  const poAmount = match.items.reduce((sum, item) => {
    if (item.poQty == null) return sum;
    const rate = item.skuMaster?.agreedRate ?? 0;
    return sum + item.poQty * rate;
  }, 0);

  const totalInvoiced = match.items.reduce((sum, item) => sum + (item.grossAmount ?? 0), 0);

  const totalReceived = match.items.reduce((sum, item) => {
    const rate = item.skuMaster?.agreedRate ?? 0;
    return sum + item.grnQty * rate;
  }, 0);

  const totalPoQty = match.items.reduce((sum, item) => sum + (item.poQty ?? 0), 0);

  const events = [
    ...match.linkedDocs.grns.map((g) => ({
      documentType: 'grn',
      documentNumber: g.grnNumber,
      date: g.grnDate,
      qty: g.items.reduce((s, it) => s + it.receivedQuantity, 0),
    })),
    ...match.linkedDocs.invoices.map((i) => ({
      documentType: 'invoice',
      documentNumber: i.invoiceNumber,
      date: i.invoiceDate,
      qty: i.items.reduce((s, it) => s + it.quantity, 0),
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let cumulativeReceivedQty = 0;
  let cumulativeInvoicedQty = 0;

  const rows = events.map((event) => {
    if (event.documentType === 'grn') cumulativeReceivedQty += event.qty;
    if (event.documentType === 'invoice') cumulativeInvoicedQty += event.qty;
    return {
      ...event,
      cumulativeReceivedQty,
      cumulativeInvoicedQty,
      pendingDeliveryQty: Math.max(totalPoQty - cumulativeReceivedQty, 0),
    };
  });

  rows.push({
    documentType: 'current_status',
    documentNumber: null,
    date: null,
    qty: null,
    status: match.status,
    cumulativeReceivedQty,
    cumulativeInvoicedQty,
    pendingDeliveryQty: Math.max(totalPoQty - cumulativeReceivedQty, 0),
  });

  return {
    poNumber,
    statCards: {
      poAmount: round2(poAmount),
      totalInvoiced: round2(totalInvoiced),
      totalReceived: round2(totalReceived),
    },
    rows,
    status: match.status,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { buildSummary };
