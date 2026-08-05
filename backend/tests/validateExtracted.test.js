const { validateExtracted } = require('../src/services/validateExtracted');
const ApiError = require('../src/utils/ApiError');

function expectRejects(documentType, data, messageFragment) {
  try {
    validateExtracted(documentType, data);
    throw new Error('expected validateExtracted to throw but it did not');
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(422);
    if (messageFragment) expect(err.message).toMatch(messageFragment);
  }
}

const validPo = {
  poNumber: 'CI4PO05788',
  poDate: '2026-03-17',
  vendorName: 'M/s AFP',
  items: [{ itemCode: '11423', description: 'Momos', quantity: 50 }],
};

const validGrn = {
  grnNumber: 'CI4000020234',
  poNumber: 'CI4PO05788',
  grnDate: '2026-03-24',
  items: [{ itemCode: '11423', description: 'Momos', receivedQuantity: 50 }],
};

const validInvoice = {
  invoiceNumber: 'IN25MH2504251',
  poNumber: 'CI4PO05788',
  invoiceDate: '2026-03-24',
  items: [{ itemCode: '11423', description: 'Momos', quantity: 50, unitRate: 220.76, mrp: 305 }],
};

describe('validateExtracted', () => {
  it('accepts a well-formed PO', () => {
    expect(() => validateExtracted('po', validPo)).not.toThrow();
  });

  it('accepts a well-formed GRN', () => {
    expect(() => validateExtracted('grn', validGrn)).not.toThrow();
  });

  it('accepts a well-formed Invoice', () => {
    expect(() => validateExtracted('invoice', validInvoice)).not.toThrow();
  });

  it('rejects a non-object payload', () => {
    expectRejects('po', null, /JSON object/);
    expectRejects('po', 'not an object', /JSON object/);
  });

  it('rejects a PO missing poNumber', () => {
    const { poNumber, ...rest } = validPo;
    expectRejects('po', rest, /poNumber/);
  });

  it('rejects a PO missing vendorName', () => {
    const { vendorName, ...rest } = validPo;
    expectRejects('po', rest, /vendorName/);
  });

  it('rejects a GRN missing grnNumber', () => {
    const { grnNumber, ...rest } = validGrn;
    expectRejects('grn', rest, /grnNumber/);
  });

  it('rejects an Invoice missing invoiceDate', () => {
    const { invoiceDate, ...rest } = validInvoice;
    expectRejects('invoice', rest, /invoiceDate/);
  });

  it('rejects a document with no items array', () => {
    expectRejects('po', { ...validPo, items: undefined }, /line items/);
  });

  it('rejects a document with an empty items array', () => {
    expectRejects('po', { ...validPo, items: [] }, /line items/);
  });

  it('rejects a PO item missing itemCode', () => {
    expectRejects('po', { ...validPo, items: [{ description: 'x', quantity: 1 }] }, /itemCode/);
  });

  it('rejects a GRN item with non-numeric receivedQuantity', () => {
    expectRejects(
      'grn',
      { ...validGrn, items: [{ itemCode: '1', description: 'x', receivedQuantity: 'fifty' }] },
      /receivedQuantity/
    );
  });

  it('rejects an Invoice item with non-numeric quantity', () => {
    expectRejects(
      'invoice',
      { ...validInvoice, items: [{ itemCode: '1', description: 'x', quantity: 'fifty' }] },
      /quantity/
    );
  });

  it('does not require unitRate/mrp on invoice items (nullable per spec)', () => {
    const items = [{ itemCode: '1', description: 'x', quantity: 5, unitRate: null, mrp: null }];
    expect(() => validateExtracted('invoice', { ...validInvoice, items })).not.toThrow();
  });

  it('rejects an unparseable poDate', () => {
    expectRejects('po', { ...validPo, poDate: 'not-a-date' }, /poDate/);
  });

  it('rejects an unparseable grnDate', () => {
    expectRejects('grn', { ...validGrn, grnDate: 'yesterday-ish' }, /grnDate/);
  });
});
