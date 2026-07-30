const mongoose = require('mongoose');
const fileMetaSchema = require('./fileMeta');

const grnItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    receivedQuantity: { type: Number, required: true },
    mrp: { type: Number, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
    unmappedReason: { type: String, default: null },
  },
  { _id: false }
);

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, trim: true },
    poNumber: { type: String, required: true, trim: true, index: true },
    grnDate: { type: Date, required: true },
    items: { type: [grnItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed },
    file: { type: fileMetaSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Grn', grnSchema);
