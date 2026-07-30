const { parseWithGemini } = require('./gemini');
const { parseWithMockGemini } = require('./mockGemini');

function isMockMode() {
  return process.env.MOCK_GEMINI === 'true' || !process.env.GEMINI_API_KEY;
}

/**
 * Single entry point the parsing pipeline calls. Picks real Gemini or the
 * mock fixture service based on env config, so the rest of the app never
 * needs to know which one is active.
 */
async function extractDocument({ filePath, mimeType, documentType }) {
  if (isMockMode()) {
    return parseWithMockGemini({ filePath, mimeType, documentType });
  }
  return parseWithGemini({ filePath, mimeType, documentType });
}

module.exports = { extractDocument, isMockMode };
