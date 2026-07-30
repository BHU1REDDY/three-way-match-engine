const poFixture = require('../fixtures/po.fixture');
const grnFixture = require('../fixtures/grn.fixture');
const invoiceFixture = require('../fixtures/invoice.fixture');

const FIXTURES = { po: poFixture, grn: grnFixture, invoice: invoiceFixture };

/**
 * Deterministic stand-in for the real Gemini call, used when MOCK_GEMINI=true
 * or no GEMINI_API_KEY is configured. Returns fixture JSON derived from the
 * assignment's real sample documents (see src/fixtures) regardless of the
 * actual uploaded file's bytes, so the full pipeline is demoable offline.
 */
async function parseWithMockGemini({ documentType }) {
  const fixture = FIXTURES[documentType];
  if (!fixture) {
    throw new Error(`No mock fixture configured for documentType "${documentType}"`);
  }
  // Deep clone so callers can't mutate the shared fixture object.
  return JSON.parse(JSON.stringify(fixture));
}

module.exports = { parseWithMockGemini };
