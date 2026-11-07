const axios = require('axios');
const config = require('../config');
const { buildPrompt } = require('./prompt');
const { parseDrafts } = require('./parseDrafts');

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function isConfigured() {
  return Boolean(config.geminiKey && config.geminiModel);
}

// Returns { drafts, model }. Throws on any failure so the caller can fall back to templates.
async function generateDrafts(brief) {
  if (!config.geminiKey) throw new Error('GEMINI_API_KEY is not set.');
  if (!config.geminiModel) throw new Error('GEMINI_MODEL is not set. Choose a current model name from the Gemini API docs.');

  const { system, user } = buildPrompt(brief);
  const url = `${ENDPOINT}/${encodeURIComponent(config.geminiModel)}:generateContent`;

  let res;
  try {
    res = await axios.post(
      url,
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
      },
      { headers: { 'x-goog-api-key': config.geminiKey, 'Content-Type': 'application/json' }, timeout: 60000 }
    );
  } catch (err) {
    const status = err.response && err.response.status;
    // Never include the API key or full response body in errors.
    throw new Error(`Gemini request failed${status ? ` (HTTP ${status})` : ''}: ${err.message}`);
  }

  const parts = res.data && res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content && res.data.candidates[0].content.parts;
  const text = parts && parts.map((p) => p.text || '').join('');
  if (!text) {
    const reason = res.data && res.data.promptFeedback && res.data.promptFeedback.blockReason;
    throw new Error(reason ? `Gemini blocked the request (${reason}).` : 'Gemini returned no content.');
  }
  return { drafts: parseDrafts(text), model: config.geminiModel };
}

module.exports = { generateDrafts, isConfigured };
