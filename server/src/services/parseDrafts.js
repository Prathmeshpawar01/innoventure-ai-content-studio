// Parses and validates the JSON the model returns. Dependency-free.
const KEYS = ['linkedin', 'instagram', 'shorts', 'newsletter'];

function extractJson(raw) {
  let s = String(raw || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) throw new Error('Model response contained no JSON object.');
  return JSON.parse(s.slice(first, last + 1));
}

function parseDrafts(raw) {
  const obj = extractJson(raw);
  const drafts = {};
  KEYS.forEach((k) => {
    const v = obj[k];
    const text = typeof v === 'string' ? v.trim() : '';
    if (text.length < 40) throw new Error(`Model response is missing a usable "${k}" draft.`);
    drafts[k] = text.slice(0, 20000);
  });
  return drafts;
}

module.exports = { parseDrafts, extractJson, KEYS };
