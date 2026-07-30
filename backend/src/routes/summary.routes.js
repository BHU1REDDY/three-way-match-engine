const express = require('express');
const { buildSummary } = require('../services/summaryEngine');

const router = express.Router();

router.get('/:poNumber', async (req, res, next) => {
  try {
    const result = await buildSummary(req.params.poNumber);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
