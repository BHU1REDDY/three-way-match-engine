const express = require('express');
const fs = require('fs');
const upload = require('../middleware/upload');
const { runUploadPipeline } = require('../services/parsingPipeline');
const ApiError = require('../utils/ApiError');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');

const router = express.Router();

const MODELS = { po: PurchaseOrder, grn: Grn, invoice: Invoice };

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded (expected multipart field "file")');
    }
    const { documentType } = req.body;
    if (!MODELS[documentType]) {
      throw new ApiError(400, 'documentType must be one of: po, grn, invoice');
    }

    const result = await runUploadPipeline({ file: req.file, documentType });

    res.status(201).json({
      documentType: result.documentType,
      document: result.doc,
      warnings: result.warnings,
      duplicate: result.duplicate,
    });
  } catch (err) {
    next(err);
  }
});

// Searches across all three collections; ?type= narrows to one, ?poNumber= filters by PO.
router.get('/', async (req, res, next) => {
  try {
    const { type, poNumber } = req.query;
    if (type && !MODELS[type]) {
      throw new ApiError(400, 'type must be one of: po, grn, invoice');
    }

    const types = type ? [type] : Object.keys(MODELS);
    const filter = poNumber ? { poNumber } : {};

    const results = await Promise.all(
      types.map(async (t) => {
        const docs = await MODELS[t].find(filter).sort({ createdAt: 1 }).lean();
        return docs.map((d) => ({ ...d, documentType: t }));
      })
    );

    res.json(results.flat());
  } catch (err) {
    next(err);
  }
});

async function findDocumentById(id) {
  for (const [type, Model] of Object.entries(MODELS)) {
    const doc = await Model.findById(id).lean();
    if (doc) return { doc, type };
  }
  return null;
}

router.get('/:id', async (req, res, next) => {
  try {
    const found = await findDocumentById(req.params.id);
    if (!found) throw new ApiError(404, 'Document not found');
    res.json({ ...found.doc, documentType: found.type });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/file', async (req, res, next) => {
  try {
    const found = await findDocumentById(req.params.id);
    if (!found) throw new ApiError(404, 'Document not found');

    const { filePath, mimeType, originalName } = found.doc.file || {};
    if (!filePath || !fs.existsSync(filePath)) {
      throw new ApiError(404, 'Original file is not available for preview');
    }

    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${originalName || 'document'}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
