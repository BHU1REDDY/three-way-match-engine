const express = require('express');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Mock auth: no real identity provider. Any request matching the demo
// credentials in .env gets a signed Bearer token back.
router.post('/login', (req, res, next) => {
  const { username, password } = req.body || {};

  if (username !== process.env.DEMO_USERNAME || password !== process.env.DEMO_PASSWORD) {
    return next(new ApiError(401, 'Invalid username or password'));
  }

  const token = jwt.sign({ sub: username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });

  res.json({ token });
});

module.exports = router;
