const { connectTestDb, disconnectTestDb, clearTestDb } = require('./testDb');
const SkuMaster = require('../src/models/SkuMaster');
const PurchaseOrder = require('../src/models/PurchaseOrder');
const Grn = require('../src/models/Grn');
const Invoice = require('../src/models/Invoice');
const { buildSummary } = require('../src/services/summaryEngine');

const FILE = { filePath: '/tmp/fake.pdf', originalName: 'fake.pdf', mimeType: 'application/pdf' };
const PO_NUMBER = 'CI4PO05788';

function createPo({ poNumber = PO_NUMBER, poDate = '2026-03-17', vendorName = 'M/s AFP', items }) {
  return PurchaseOrder.create({ poNumber, poDate: new Date(poDate), vendorName, items, file: FILE });
}

function createGrn({ grnNumber, poNumber = PO_NUMBER, grnDate, items }) {
  return Grn.create({ grnNumber, poNumber, grnDate: new Date(grnDate), items, file: FILE });
}

function createInvoice({ invoiceNumber, poNumber = PO_NUMBER, invoiceDate, items }) {
  return Invoice.create({ invoiceNumber, poNumber, invoiceDate: new Date(invoiceDate), items, file: FILE });
}

function seedSku(overrides = {}) {
  return SkuMaster.create({
    skuErpCode: '11423',
    name: 'Momos',
    agreedRate: 200,
    mrp: 300,
    priceTolerance: 0.05,
    ...overrides,
  });
}

describe('buildSummary', () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => disconnectTestDb());
  afterEach(async () => clearTestDb());

  it('values PO Amount and Total Received at SkuMaster.agreedRate, Total Invoiced at the billed unitRate', async () => {
    await seedSku({ agreedRate: 200 });
    await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
    await createGrn({
      grnNumber: 'G1',
      grnDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }],
    });
    await createInvoice({
      invoiceNumber: 'I1',
      invoiceDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220 }],
    });

    const summary = await buildSummary(PO_NUMBER);
    expect(summary.statCards.poAmount).toBe(50 * 200);
    expect(summary.statCards.totalReceived).toBe(50 * 200);
    expect(summary.statCards.totalInvoiced).toBe(50 * 220);
  });

  it('produces one row per GRN/Invoice document plus a final Current Status row', async () => {
    await seedSku();
    await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 100 }] });
    await createGrn({
      grnNumber: 'G1',
      grnDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 100 }],
    });
    await createInvoice({
      invoiceNumber: 'I1',
      invoiceDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', quantity: 100, unitRate: 200 }],
    });

    const summary = await buildSummary(PO_NUMBER);
    expect(summary.rows).toHaveLength(3); // 1 GRN + 1 Invoice + Current Status
    expect(summary.rows[summary.rows.length - 1].documentType).toBe('current_status');
    expect(summary.rows[summary.rows.length - 1].status).toBe(summary.status);
  });

  it('accumulates cumulative received/invoiced quantities in chronological order across multiple documents', async () => {
    await seedSku();
    await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 100 }] });
    // Deliberately created out of chronological order to prove sorting is by date, not insertion order.
    await createGrn({
      grnNumber: 'G2',
      grnDate: '2026-03-25',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 40 }],
    });
    await createGrn({
      grnNumber: 'G1',
      grnDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 60 }],
    });
    await createInvoice({
      invoiceNumber: 'I1',
      invoiceDate: '2026-03-22',
      items: [{ itemCode: '11423', description: 'Momos', quantity: 60, unitRate: 200 }],
    });

    const summary = await buildSummary(PO_NUMBER);
    const docRows = summary.rows.filter((r) => r.documentType !== 'current_status');
    // Chronological: G1 (20th, +60) -> I1 (22nd, +60 invoiced) -> G2 (25th, +40)
    expect(docRows.map((r) => r.documentNumber)).toEqual(['G1', 'I1', 'G2']);
    expect(docRows[0].cumulativeReceivedQty).toBe(60);
    expect(docRows[1].cumulativeInvoicedQty).toBe(60);
    expect(docRows[2].cumulativeReceivedQty).toBe(100);

    const statusRow = summary.rows[summary.rows.length - 1];
    expect(statusRow.cumulativeReceivedQty).toBe(100);
    expect(statusRow.cumulativeInvoicedQty).toBe(60);
  });

  it('never lets pendingDeliveryQty go negative even if received exceeds PO qty', async () => {
    await seedSku();
    await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 10 }] });
    await createGrn({
      grnNumber: 'G1',
      grnDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 999 }],
    });
    await createInvoice({
      invoiceNumber: 'I1',
      invoiceDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', quantity: 10, unitRate: 200 }],
    });

    const summary = await buildSummary(PO_NUMBER);
    for (const row of summary.rows) {
      expect(row.pendingDeliveryQty).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns zeroed stat cards and empty document rows when the PO does not exist yet', async () => {
    await createGrn({
      grnNumber: 'G1',
      grnDate: '2026-03-20',
      items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 5 }],
    });

    const summary = await buildSummary(PO_NUMBER);
    expect(summary.status).toBe('insufficient_documents');
    expect(summary.statCards).toEqual({ poAmount: 0, totalInvoiced: 0, totalReceived: 0 });
  });
});
