// Deterministic mock-Gemini response for a GRN upload, modelled on the real
// sample GRN (CI4000020234 against PO CI4PO05788). Items 3 & 4 are partially
// received on purpose (30 of 120, 30 of 540 - matches the real document) so
// the match engine's partial-reconciliation logic has real data to exercise.
// The last item does not exist on the PO at all, to demonstrate
// item_missing_in_po.
module.exports = {
  grnNumber: 'CI4000020234',
  poNumber: 'CI4PO05788',
  grnDate: '2026-03-24',
  items: [
    { itemCode: '11423', description: 'Cheesy Spicy Veg Momos 24.0 Pieces', receivedQuantity: 50, mrp: 305.0 },
    { itemCode: '11797', description: 'Meatigo Hot Wings 250.0 g', receivedQuantity: 75, mrp: 175.0 },
    { itemCode: '18003', description: 'Meatigo Chicken Curry Cut Skinless Frozen 450.0 g', receivedQuantity: 30, mrp: 195.0 },
    { itemCode: '18004', description: 'Meatigo Chicken Boneless Breast Frozen 450.0 g', receivedQuantity: 30, mrp: 275.0 },
    { itemCode: '205950', description: 'Frozen Pork Pepperoni Salami 100.0 g', receivedQuantity: 40, mrp: 185.0 },
    { itemCode: '253430', description: 'Pork Salami 200.0 g', receivedQuantity: 75, mrp: 260.0 },
    { itemCode: '33387', description: 'Frozen Chicken Chilli Salami 200.0 g', receivedQuantity: 75, mrp: 175.0 },
    { itemCode: '33390', description: 'Chicken Seekh Kebab 500.0 g', receivedQuantity: 272, mrp: 315.0 },
    { itemCode: '398656', description: 'Meatigo Chicken Drumsticks 450.0 g', receivedQuantity: 270, mrp: 260.0 },
    { itemCode: '414867', description: 'Chinese Veg Spring Rolls 240.0 g', receivedQuantity: 25, mrp: 165.0 },
    { itemCode: 'GRN-EXTRA-001', description: 'Unbudgeted Sample Pack (not on PO)', receivedQuantity: 5, mrp: 50.0 },
  ],
};
