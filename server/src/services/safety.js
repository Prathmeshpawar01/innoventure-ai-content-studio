// Safety layer applied to ALL drafts, whether written by Gemini or the template fallback.
// Dependency-free so it can be unit tested.
const template = require('./templateGenerator');

// [VERIFY: ...] markers and ALL-CAPS placeholders such as [SENDER NAME] or [FIRST NAME].
const PLACEHOLDER_RE = /\[VERIFY[^\]]*\]|\[[A-Z][A-Z0-9 \/'-]{2,}\]/g;

function findPlaceholders(text) {
  return String(text || '').match(PLACEHOLDER_RE) || [];
}

// Numbers like 85, 2,500 or 40% in a draft that never appeared in the brief are possible invented statistics.
function unverifiedNumbers(brief, text) {
  const briefText = Object.values(brief || {}).map((v) => (Array.isArray(v) ? v.join(' ') : String(v || ''))).join(' ');
  const stripped = String(text || '')
    .replace(/\b\d+\s*-\s*\d+\s*s\b/gi, '')        // timestamps like 3-13s
    .replace(/^\s*\d+\.\s/gm, '')                   // list numbering
    .replace(/https?:\/\/\S+/g, '');                // links
  const found = stripped.match(/\b\d{2,}(?:[.,]\d+)*%?|\b\d+(?:\.\d+)?%/g) || [];
  return [...new Set(found)].filter((n) => !briefText.includes(n));
}

function reviewDrafts(brief, drafts) {
  const warnings = template.checkSafety(brief, drafts).map((w) => ({ where: w.where, msg: w.msg }));
  Object.keys(drafts).forEach((platform) => {
    unverifiedNumbers(brief, drafts[platform]).forEach((n) => {
      warnings.push({ where: platform, msg: `The number "${n}" is not in your brief. Verify it or remove it (possible invented statistic).` });
    });
  });
  const flags = [];
  Object.keys(drafts).forEach((platform) => {
    const ph = findPlaceholders(drafts[platform]);
    if (ph.length) flags.push(`${platform}: ${ph.length} placeholder(s) to resolve before approval`);
  });
  return { warnings, flags };
}

module.exports = { findPlaceholders, unverifiedNumbers, reviewDrafts, PLACEHOLDER_RE };
