const express = require('express');
const { computeMatch } = require('../services/matchEngine');

const router = express.Router();

// Always recomputes from current stored documents - never returns a stale
// cached result, per spec.
router.get('/:poNumber', async (req, res, next) => {
  try {
    const result = await computeMatch(req.params.poNumber);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
