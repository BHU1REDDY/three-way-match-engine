const mongoose = require('mongoose');
const fileMetaSchema = require('./fileMeta');

const poItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
    unmappedReason: { type: String, default: null },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true, index: true },
    poDate: { type: Date, required: true },
    vendorName: { type: String, trim: true, default: '' },
    items: { type: [poItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed },
    file: { type: fileMetaSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
