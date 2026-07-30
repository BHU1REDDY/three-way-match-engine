const ApiError = require('../utils/ApiError');

// Central error handler: maps thrown errors to sensible status codes and
// never leaks stack traces or secrets (API keys, Mongo URIs) to the client.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid id: ${err.value}` });
  }

  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 20MB)' });
  }

  console.error(err); // server-side only; response below is generic

  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
