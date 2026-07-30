// Deterministic mock-Gemini response for a PO upload, modelled on the real
// sample PO (CI4PO05788, M/s AFP -> Cloudstore Retail). Includes the 10 items
// that also appear in the mock GRN/Invoice fixtures, plus 2 items that are
// never delivered (demonstrates "pending delivery" in the summary tab).
module.exports = {
  poNumber: 'CI4PO05788',
  poDate: '2026-03-17',
  vendorName: 'M/s AFP',
  items: [
    { itemCode: '11423', description: 'Cheesy Spicy Veg Momos 24.0 Pieces', quantity: 50 },
    { itemCode: '11797', description: 'Meatigo Hot Wings 250.0 g', quantity: 75 },
    { itemCode: '18003', description: 'Meatigo Chicken Curry Cut Skinless Frozen 450.0 g', quantity: 120 },
    { itemCode: '18004', description: 'Meatigo Chicken Boneless Breast Frozen 450.0 g', quantity: 540 },
    { itemCode: '205950', description: 'Frozen Pork Pepperoni Salami 100.0 g', quantity: 40 },
    { itemCode: '253430', description: 'Pork Salami 200.0 g', quantity: 75 },
    { itemCode: '33387', description: 'Frozen Chicken Chilli Salami 200.0 g', quantity: 75 },
    { itemCode: '33390', description: 'Chicken Seekh Kebab 500.0 g', quantity: 272 },
    { itemCode: '398656', description: 'Meatigo Chicken Drumsticks 450.0 g', quantity: 270 },
    { itemCode: '414867', description: 'Chinese Veg Spring Rolls 240.0 g', quantity: 25 },
    { itemCode: '432518', description: 'Meatigo Chicken Kheema 450.0 g', quantity: 360 },
    { itemCode: '4459', description: 'Original Chicken Momos 24.0 Pieces', quantity: 475 },
  ],
};
