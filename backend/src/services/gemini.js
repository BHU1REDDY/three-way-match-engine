const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPromptFor } = require('../prompts/documentPrompts');

function extractJson(text) {
  // Gemini sometimes wraps JSON in ```json ... ``` fences despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

// Transient server-side hiccups (model overloaded, rate limited) are common
// in practice and unrelated to whether our prompt/schema is correct - worth
// retrying with backoff, separately from the "malformed JSON" retry below.
function isTransientError(err) {
  const message = String(err?.message || '');
  return /\[(429|500|503)\s*\]/.test(message) || /overloaded|high demand|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiOnce({ filePath, mimeType, documentType, clarify }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

  const fileBuffer = fs.readFileSync(filePath);
  const basePrompt = getPromptFor(documentType);
  const prompt = clarify
    ? `${basePrompt}\n\nYour previous response was not valid JSON matching this schema. Return ONLY the corrected JSON object.`
    : basePrompt;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
  ]);

  const text = result.response.text();
  return extractJson(text);
}

/** Retries transient (5xx/429) failures with backoff; rethrows immediately
 * on anything else (bad JSON, missing key, etc.) so the caller's own
 * malformed-output retry logic can handle those. */
async function callWithTransientRetry(args, { attempts = 3, baseDelayMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await callGeminiOnce(args);
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || attempt === attempts - 1) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

/**
 * Calls Gemini for the given file/documentType, retrying once if the first
 * response isn't parseable JSON. Throws on final failure - caller decides
 * how to surface that (422, not persisted).
 */
async function parseWithGemini({ filePath, mimeType, documentType }) {
  try {
    return await callWithTransientRetry({ filePath, mimeType, documentType, clarify: false });
  } catch (firstErr) {
    return callWithTransientRetry({ filePath, mimeType, documentType, clarify: true });
  }
}

module.exports = { parseWithGemini };
