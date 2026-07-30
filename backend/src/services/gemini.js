const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPromptFor } = require('../prompts/documentPrompts');

function extractJson(text) {
  // Gemini sometimes wraps JSON in ```json ... ``` fences despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
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

/**
 * Calls Gemini for the given file/documentType, retrying once if the first
 * response isn't parseable JSON. Throws on final failure - caller decides
 * how to surface that (422, not persisted).
 */
async function parseWithGemini({ filePath, mimeType, documentType }) {
  try {
    return await callGeminiOnce({ filePath, mimeType, documentType, clarify: false });
  } catch (firstErr) {
    return callGeminiOnce({ filePath, mimeType, documentType, clarify: true });
  }
}

module.exports = { parseWithGemini };
