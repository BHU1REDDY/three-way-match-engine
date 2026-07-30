// Deterministic mock-Gemini response for an Invoice upload, modelled on the
// real sample Invoice (IN25MH2504251 against PO CI4PO05788). Invoice line
// item codes are the vendor's own internal codes (e.g. "FG-P-F-0503"), which
// intentionally differ from the numeric codes PO/GRN use for the same
// products - this is the case the assignment calls out explicitly
// ("matching on raw strings fails; matching on the resolved SKU Master
// record works"). SkuMaster.eanCode is seeded with these FG codes so
// resolution still succeeds. See README "Master resolution" section.
module.exports = {
  invoiceNumber: 'IN25MH2504251',
  poNumber: 'CI4PO05788',
  invoiceDate: '2026-03-24',
  items: [
    { itemCode: 'FG-P-F-0503', description: 'PSM Cheesy Spicy Vegetable Momos 24Pcs', quantity: 50, unitRate: 220.76, mrp: 305.0 },
    { itemCode: 'FG-M-F-1703', description: 'Meatigo RTC Meatigo Hot Wings 250g', quantity: 75, unitRate: 126.67, mrp: 175.0 },
    { itemCode: 'FG-M-F-0620', description: 'Meatigo Chicken Curry Cuts 450g (5%)', quantity: 30, unitRate: 141.14, mrp: 195.0 },
    { itemCode: 'FG-M-F-0619', description: 'Meatigo Chicken Boneless Breast 450g (5%)', quantity: 30, unitRate: 199.05, mrp: 275.0 },
    { itemCode: 'FG-P-F-0237', description: 'PSM Frozen Pork Pepperoni Salami 100g', quantity: 40, unitRate: 133.9, mrp: 185.0 },
    // Price mismatch on purpose: SkuMaster.agreedRate is seeded at 150, this
    // invoice bills 188.19 (~25% over) -> exercises price_mismatch.
    { itemCode: 'FG-P-F-0249', description: 'PSM Pork Plain Salami 200g', quantity: 75, unitRate: 188.19, mrp: 260.0 },
    // No SkuMaster is seeded for 33387/FG-P-F-0234 on purpose -> exercises
    // unmapped_master_sku.
    { itemCode: 'FG-P-F-0234', description: 'PSM Frozen Chicken Chilli Salami 200g', quantity: 75, unitRate: 126.67, mrp: 175.0 },
    { itemCode: 'FG-P-F-0413', description: 'PSM Frozen Chicken Seekh Kabab 500g', quantity: 272, unitRate: 228.0, mrp: 315.0 },
    // MRP mismatch on purpose: SkuMaster.mrp is seeded at 300, this invoice
    // shows 260 (~13% under) -> exercises mrp_mismatch.
    { itemCode: 'FG-M-F-0602', description: 'Meatigo Chicken Drumsticks 450g (5%)', quantity: 270, unitRate: 188.19, mrp: 260.0 },
    { itemCode: 'FG-P-F-1707', description: 'PSM Spring Roll - Chinese Veg 240g', quantity: 25, unitRate: 119.43, mrp: 165.0 },
  ],
};
