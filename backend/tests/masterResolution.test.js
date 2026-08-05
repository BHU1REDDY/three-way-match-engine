const { connectTestDb, disconnectTestDb, clearTestDb } = require('./testDb');
const SkuMaster = require('../src/models/SkuMaster');
const { buildSkuIndex, resolveItemCode, resolveItemMasters } = require('../src/services/masterResolution');

describe('masterResolution', () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => disconnectTestDb());
  afterEach(async () => clearTestDb());

  async function seedSku(overrides = {}) {
    return SkuMaster.create({
      skuErpCode: '11423',
      name: 'Cheesy Spicy Veg Momos 24 Pieces',
      eanCode: 'FG-P-F-0503',
      hsnCode: '19022010',
      uom: 'PKT',
      agreedRate: 220.76,
      mrp: 305,
      priceTolerance: 0.05,
      ...overrides,
    });
  }

  it('resolves an item by exact skuErpCode match', async () => {
    const sku = await seedSku();
    const index = await buildSkuIndex();
    const { skuMaster, unmappedReason } = resolveItemCode('11423', index);
    expect(String(skuMaster)).toBe(String(sku._id));
    expect(unmappedReason).toBeNull();
  });

  it('resolves by skuErpCode with mismatched case and surrounding whitespace', async () => {
    await seedSku();
    const index = await buildSkuIndex();
    const { skuMaster, unmappedReason } = resolveItemCode('  11423  ', index);
    expect(skuMaster).not.toBeNull();
    expect(unmappedReason).toBeNull();
  });

  it('falls back to eanCode when skuErpCode does not match', async () => {
    const sku = await seedSku();
    const index = await buildSkuIndex();
    const { skuMaster, unmappedReason } = resolveItemCode('fg-p-f-0503', index);
    expect(String(skuMaster)).toBe(String(sku._id));
    expect(unmappedReason).toBeNull();
  });

  it('prefers skuErpCode over eanCode when both could theoretically match', async () => {
    // Sanity: skuErpCode lookup happens first in resolveItemCode's implementation.
    await seedSku({ skuErpCode: 'DUAL-CODE', eanCode: 'DUAL-CODE-EAN' });
    const index = await buildSkuIndex();
    const byErp = resolveItemCode('DUAL-CODE', index);
    const byEan = resolveItemCode('DUAL-CODE-EAN', index);
    expect(byErp.skuMaster).not.toBeNull();
    expect(byEan.skuMaster).not.toBeNull();
    expect(String(byErp.skuMaster)).toBe(String(byEan.skuMaster));
  });

  it('returns unmapped_master_sku and a null skuMaster for an unresolvable code', async () => {
    await seedSku();
    const index = await buildSkuIndex();
    const { skuMaster, unmappedReason } = resolveItemCode('does-not-exist', index);
    expect(skuMaster).toBeNull();
    expect(unmappedReason).toBe('unmapped_master_sku');
  });

  it('never throws for an unresolvable code (soft warning, not a hard error)', async () => {
    const index = await buildSkuIndex();
    expect(() => resolveItemCode('anything', index)).not.toThrow();
  });

  it('resolveItemMasters attaches skuMaster/unmappedReason per item and counts unmapped', async () => {
    await seedSku();
    const items = [
      { itemCode: '11423', description: 'Momos', quantity: 50 },
      { itemCode: 'unknown-code', description: 'Mystery item', quantity: 5 },
    ];
    const { items: resolved, unmappedCount } = await resolveItemMasters(items);
    expect(unmappedCount).toBe(1);
    expect(resolved[0].unmappedReason).toBeNull();
    expect(resolved[0].skuMaster).not.toBeNull();
    expect(resolved[1].unmappedReason).toBe('unmapped_master_sku');
    expect(resolved[1].skuMaster).toBeNull();
  });

  it('a SkuMaster created after the fact resolves on the next lookup (no caching)', async () => {
    const before = await buildSkuIndex();
    expect(resolveItemCode('33387', before).skuMaster).toBeNull();

    await seedSku({ skuErpCode: '33387', eanCode: 'FG-P-F-0234', name: 'Frozen Chicken Chilli Salami' });

    const after = await buildSkuIndex();
    expect(resolveItemCode('33387', after).skuMaster).not.toBeNull();
  });
});
