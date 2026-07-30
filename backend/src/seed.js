require('dotenv').config();
const { connectDb } = require('./config/db');
const SkuMaster = require('./models/SkuMaster');
const mongoose = require('mongoose');

// Matches the itemCodes used in src/fixtures/{po,grn,invoice}.fixture.js.
// "33387" is deliberately left unseeded to demonstrate unmapped_master_sku.
// 253430's agreedRate and 398656's mrp are deliberately off-market to
// demonstrate price_mismatch / mrp_mismatch. See README "Master resolution".
const SKUS = [
  { skuErpCode: '11423', eanCode: 'FG-P-F-0503', name: 'Cheesy Spicy Veg Momos 24 Pieces', hsnCode: '19022010', uom: 'PKT', agreedRate: 220.76, mrp: 305.0, priceTolerance: 0.05 },
  { skuErpCode: '11797', eanCode: 'FG-M-F-1703', name: 'Meatigo Hot Wings 250g', hsnCode: '02071400', uom: 'PKT', agreedRate: 126.67, mrp: 175.0, priceTolerance: 0.05 },
  { skuErpCode: '18003', eanCode: 'FG-M-F-0620', name: 'Meatigo Chicken Curry Cut Skinless Frozen 450g', hsnCode: '02071300', uom: 'PKT', agreedRate: 141.14, mrp: 195.0, priceTolerance: 0.05 },
  { skuErpCode: '18004', eanCode: 'FG-M-F-0619', name: 'Meatigo Chicken Boneless Breast Frozen 450g', hsnCode: '02071300', uom: 'PKT', agreedRate: 199.05, mrp: 275.0, priceTolerance: 0.05 },
  { skuErpCode: '205950', eanCode: 'FG-P-F-0237', name: 'Frozen Pork Pepperoni Salami 100g', hsnCode: '16010000', uom: 'PKT', agreedRate: 133.9, mrp: 185.0, priceTolerance: 0.05 },
  { skuErpCode: '253430', eanCode: 'FG-P-F-0249', name: 'Pork Salami 200g', hsnCode: '16010000', uom: 'PKT', agreedRate: 150.0, mrp: 260.0, priceTolerance: 0.05 },
  { skuErpCode: '33390', eanCode: 'FG-P-F-0413', name: 'Chicken Seekh Kebab 500g', hsnCode: '16010000', uom: 'PKT', agreedRate: 228.0, mrp: 315.0, priceTolerance: 0.05 },
  { skuErpCode: '398656', eanCode: 'FG-M-F-0602', name: 'Meatigo Chicken Drumsticks 450g', hsnCode: '02071400', uom: 'PKT', agreedRate: 188.19, mrp: 300.0, priceTolerance: 0.05 },
  { skuErpCode: '414867', eanCode: 'FG-P-F-1707', name: 'Chinese Veg Spring Rolls 240g', hsnCode: '20049000', uom: 'PKT', agreedRate: 119.43, mrp: 165.0, priceTolerance: 0.05 },
];

async function seed() {
  await connectDb();
  for (const sku of SKUS) {
    await SkuMaster.findOneAndUpdate({ skuErpCode: sku.skuErpCode }, sku, {
      upsert: true,
      returnDocument: 'after',
    });
  }
  console.log(`Seeded ${SKUS.length} SkuMaster records.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
