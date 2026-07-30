const mongoose = require('mongoose');

// Shared sub-schema for the raw uploaded file, embedded in PO/GRN/Invoice docs.
const fileMetaSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

module.exports = fileMetaSchema;
