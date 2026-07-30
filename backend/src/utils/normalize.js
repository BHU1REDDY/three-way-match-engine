/** Trim + lowercase for case/whitespace-insensitive code comparisons. */
function normalizeCode(code) {
  return String(code ?? '').trim().toLowerCase();
}

module.exports = { normalizeCode };
