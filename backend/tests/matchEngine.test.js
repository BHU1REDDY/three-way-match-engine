const { connectTestDb, disconnectTestDb, clearTestDb } = require('./testDb');
const SkuMaster = require('../src/models/SkuMaster');
const PurchaseOrder = require('../src/models/PurchaseOrder');
const Grn = require('../src/models/Grn');
const Invoice = require('../src/models/Invoice');
const { computeMatch } = require('../src/services/matchEngine');

const FILE = { filePath: '/tmp/fake.pdf', originalName: 'fake.pdf', mimeType: 'application/pdf' };
const PO_NUMBER = 'CI4PO05788';

function createPo({ poNumber = PO_NUMBER, poDate = '2026-03-17', vendorName = 'M/s AFP', items }) {
  return PurchaseOrder.create({ poNumber, poDate: new Date(poDate), vendorName, items, file: FILE });
}

function createGrn({ grnNumber = 'GRN-1', poNumber = PO_NUMBER, grnDate = '2026-03-24', items }) {
  return Grn.create({ grnNumber, poNumber, grnDate: new Date(grnDate), items, file: FILE });
}

// Defaults to the same day as the default PO date so tests that aren't
// specifically about invoice_date_after_po_date don't trip that rule.
function createInvoice({ invoiceNumber = 'INV-1', poNumber = PO_NUMBER, invoiceDate = '2026-03-17', items }) {
  return Invoice.create({ invoiceNumber, poNumber, invoiceDate: new Date(invoiceDate), items, file: FILE });
}

function seedSku(overrides = {}) {
  return SkuMaster.create({
    skuErpCode: '11423',
    name: 'Cheesy Spicy Veg Momos',
    eanCode: null,
    hsnCode: '19022010',
    uom: 'PKT',
    agreedRate: 220.76,
    mrp: 305,
    priceTolerance: 0.05,
    ...overrides,
  });
}

describe('computeMatch', () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => disconnectTestDb());
  afterEach(async () => clearTestDb());

  describe('insufficient_documents', () => {
    it('when no documents exist at all', async () => {
      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('insufficient_documents');
      expect(result.items).toEqual([]);
    });

    it('when only a PO exists', async () => {
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('insufficient_documents');
    });

    it('when PO + GRN exist but no Invoice', async () => {
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('insufficient_documents');
    });

    it('does not treat a missing document type as zero quantity', async () => {
      // Only PO + Invoice, no GRN - if this were treated as grnQty=0 it would
      // wrongly look like a qty mismatch instead of "insufficient_documents".
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });
      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('insufficient_documents');
      expect(result.reasons).not.toContain('grn_qty_exceeds_po_qty');
    });
  });

  describe('matched', () => {
    it('when PO/GRN/Invoice fully reconcile with no reasons at all', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50, mrp: 305 }] });
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76, mrp: 305 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('matched');
      expect(result.reasons).toEqual([]);
      expect(result.items[0].reasons).toEqual([]);
    });

    it('aggregates the same SKU across multiple lines within one document', async () => {
      await seedSku();
      await createPo({
        items: [
          { itemCode: '11423', description: 'Momos batch 1', quantity: 30 },
          { itemCode: '11423', description: 'Momos batch 2', quantity: 20 },
        ],
      });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50, mrp: 305 }] });
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76, mrp: 305 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].poQty).toBe(50);
      expect(result.status).toBe('matched');
    });
  });

  describe('partially_matched (soft warnings / partial reconciliation)', () => {
    it('when GRN qty is less than PO qty (partial delivery, no hard violation)', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 120 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 30, mrp: 305 }] });
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 30, unitRate: 220.76, mrp: 305 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('partially_matched');
      expect(result.reasons).not.toEqual(expect.arrayContaining(['grn_qty_exceeds_po_qty']));
    });

    it('on a price mismatch beyond tolerance', async () => {
      await seedSku({ agreedRate: 150, priceTolerance: 0.05 });
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      // 188.19 vs agreedRate 150 -> ~25% over, well past 5% tolerance
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 188.19 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('price_mismatch');
      expect(result.status).toBe('partially_matched');
    });

    it('on an MRP mismatch beyond ~1%', async () => {
      await seedSku({ mrp: 300 });
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50, mrp: 260 }] });
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('mrp_mismatch');
      expect(result.status).toBe('partially_matched');
    });

    it('on an unresolved SKU (unmapped_master_sku), item stays visible rather than dropped', async () => {
      // No SkuMaster seeded at all.
      await createPo({ items: [{ itemCode: 'unknown-code', description: 'Mystery', quantity: 10 }] });
      await createGrn({ items: [{ itemCode: 'unknown-code', description: 'Mystery', receivedQuantity: 10 }] });
      await createInvoice({ items: [{ itemCode: 'unknown-code', description: 'Mystery', quantity: 10 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.status).toBe('partially_matched');
      expect(result.reasons).toContain('unmapped_master_sku');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].skuMaster).toBeNull();
    });
  });

  describe('mismatch (hard violations)', () => {
    it('grn_qty_exceeds_po_qty', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 60 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('grn_qty_exceeds_po_qty');
      expect(result.status).toBe('mismatch');
    });

    it('invoice_qty_exceeds_grn_qty', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 30 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 40, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('invoice_qty_exceeds_grn_qty');
      expect(result.status).toBe('mismatch');
    });

    it('invoice_qty_exceeds_po_qty', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 60, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('invoice_qty_exceeds_po_qty');
      expect(result.status).toBe('mismatch');
    });

    it('invoice_date_after_po_date', async () => {
      await seedSku();
      await createPo({ poDate: '2026-03-17', items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createInvoice({
        invoiceDate: '2026-04-01',
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }],
      });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('invoice_date_after_po_date');
      expect(result.status).toBe('mismatch');
    });

    it('duplicate_po when a second PO document exists for the same poNumber', async () => {
      await seedSku();
      const items = [{ itemCode: '11423', description: 'Momos', quantity: 50 }];
      await createPo({ items });
      await createPo({ items }); // second PO, same poNumber - stored, not overwritten
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('duplicate_po');
      expect(result.status).toBe('mismatch');
      expect(result.linkedDocs.po).toHaveLength(2);
    });

    it('duplicate_document when two GRNs share a grnNumber under the same poNumber', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ grnNumber: 'SAME-GRN', items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createGrn({ grnNumber: 'SAME-GRN', items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('duplicate_document');
      expect(result.status).toBe('mismatch');
    });

    it('item_missing_in_po when a GRN item has no corresponding PO item', async () => {
      await seedSku();
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({
        items: [
          { itemCode: '11423', description: 'Momos', receivedQuantity: 50 },
          { itemCode: 'not-on-po', description: 'Surprise item', receivedQuantity: 5 },
        ],
      });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).toContain('item_missing_in_po');
      expect(result.status).toBe('mismatch');
      const extra = result.items.find((i) => i.itemCode === 'not-on-po');
      expect(extra.poQty).toBeNull();
      expect(extra.reasons).toContain('item_missing_in_po');
    });
  });

  describe('divide-by-zero guards', () => {
    it('a zero agreedRate never produces price_mismatch or throws', async () => {
      await seedSku({ agreedRate: 0 });
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });

      await expect(
        createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 999 }] })
      ).resolves.toBeTruthy();

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).not.toContain('price_mismatch');
    });

    it('a zero mrp never produces mrp_mismatch or throws', async () => {
      await seedSku({ mrp: 0 });
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50, mrp: 999 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76 }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).not.toContain('mrp_mismatch');
    });

    it('a missing (null) unitRate never produces price_mismatch', async () => {
      await seedSku({ agreedRate: 220.76 });
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }] });
      await createInvoice({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: null }] });

      const result = await computeMatch(PO_NUMBER);
      expect(result.reasons).not.toContain('price_mismatch');
    });
  });

  describe('live re-resolution', () => {
    it('picks up a SkuMaster created after the documents were uploaded', async () => {
      await createPo({ items: [{ itemCode: '33387', description: 'Salami', quantity: 75 }] });
      await createGrn({ items: [{ itemCode: '33387', description: 'Salami', receivedQuantity: 75 }] });
      await createInvoice({ items: [{ itemCode: '33387', description: 'Salami', quantity: 75, unitRate: 126.67 }] });

      const before = await computeMatch(PO_NUMBER);
      expect(before.reasons).toContain('unmapped_master_sku');
      expect(before.items[0].skuMaster).toBeNull();

      await seedSku({ skuErpCode: '33387', name: 'Frozen Chicken Chilli Salami', agreedRate: 126.67 });

      const after = await computeMatch(PO_NUMBER);
      expect(after.items[0].skuMaster).not.toBeNull();
      expect(after.status).toBe('matched');
    });
  });

  describe('never returns a stale result', () => {
    it('reflects documents uploaded after an earlier computeMatch call', async () => {
      await createPo({ items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }] });
      const first = await computeMatch(PO_NUMBER);
      expect(first.status).toBe('insufficient_documents');

      await seedSku();
      await createGrn({ items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50, mrp: 305 }] });
      await createInvoice({
        items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76, mrp: 305 }],
      });

      const second = await computeMatch(PO_NUMBER);
      expect(second.status).toBe('matched');
    });
  });
});
