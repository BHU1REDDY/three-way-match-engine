const express = require('express');
const SkuMaster = require('../models/SkuMaster');
const ApiError = require('../utils/ApiError');

const router = express.Router();

function validatePayload(body, { partial = false } = {}) {
  const errors = [];
  const required = ['skuErpCode', 'name'];

  if (!partial) {
    for (const field of required) {
      if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
        errors.push(`"${field}" is required`);
      }
    }
  }

  for (const numField of ['agreedRate', 'mrp', 'priceTolerance']) {
    if (body[numField] !== undefined && body[numField] !== null && typeof body[numField] !== 'number') {
      errors.push(`"${numField}" must be a number`);
    }
  }

  if (errors.length) throw new ApiError(400, 'Validation failed', errors);
}

router.post('/sku', async (req, res, next) => {
  try {
    validatePayload(req.body);
    const sku = await SkuMaster.create(req.body);
    res.status(201).json(sku);
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(409, 'A SkuMaster with this skuErpCode already exists'));
    }
    next(err);
  }
});

router.get('/sku', async (req, res, next) => {
  try {
    const skus = await SkuMaster.find({}).sort({ createdAt: -1 });
    res.json(skus);
  } catch (err) {
    next(err);
  }
});

router.get('/sku/:id', async (req, res, next) => {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) throw new ApiError(404, 'SkuMaster not found');
    res.json(sku);
  } catch (err) {
    next(err);
  }
});

router.patch('/sku/:id', async (req, res, next) => {
  try {
    validatePayload(req.body, { partial: true });
    const sku = await SkuMaster.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sku) throw new ApiError(404, 'SkuMaster not found');
    res.json(sku);
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(409, 'A SkuMaster with this skuErpCode already exists'));
    }
    next(err);
  }
});

router.delete('/sku/:id', async (req, res, next) => {
  try {
    const sku = await SkuMaster.findByIdAndDelete(req.params.id);
    if (!sku) throw new ApiError(404, 'SkuMaster not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
