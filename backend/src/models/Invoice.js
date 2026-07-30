const mongoose = require('mongoose');
const fileMetaSchema = require('./fileMeta');

const invoiceItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true },
    unitRate: { type: Number, default: null },
    mrp: { type: Number, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
    unmappedReason: { type: String, default: null },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    poNumber: { type: String, required: true, trim: true, index: true },
    invoiceDate: { type: Date, required: true },
    items: { type: [invoiceItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed },
    file: { type: fileMetaSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
