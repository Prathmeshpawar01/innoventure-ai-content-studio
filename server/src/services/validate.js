// Dependency-free input validation and sanitising for the campaign brief.
const AUDIENCES = ['leaders', 'teachers', 'parents', 'children'];
const OBJECTIVES = ['AWARENESS', 'ENGAGEMENT', 'REGISTRATION', 'EVENT PROMOTION', 'LEAD GENERATION'];
const TONES = ['warm', 'professional', 'playful', 'inspiring'];
const TEXT_FIELDS = ['topic', 'campaign', 'description', 'keyMessage', 'eventDetails', 'link', 'handle', 'ageRange', 'activity'];
const MAX_LEN = 2000;

function cleanText(v) {
  // eslint-disable-next-line no-control-regex
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, MAX_LEN);
}

// Returns { brief, errors }. Missing optional facts are allowed: they get flagged for human verification later.
function validateBrief(input) {
  const errors = [];
  const src = input && typeof input === 'object' ? input : {};
  const brief = {};
  TEXT_FIELDS.forEach((k) => { brief[k] = cleanText(src[k]); });

  const aud = Array.isArray(src.audiences) ? src.audiences.map(String) : [];
  brief.audiences = AUDIENCES.filter((a) => aud.includes(a));
  if (!brief.audiences.length) errors.push('Choose at least one target audience.');

  brief.objective = OBJECTIVES.includes(src.objective) ? src.objective : '';
  if (!brief.objective) errors.push('Choose an objective.');

  brief.tone = TONES.includes(src.tone) ? src.tone : '';
  if (!brief.tone) errors.push('Choose a tone.');

  if (brief.link && !/^https?:\/\/\S+$/i.test(brief.link)) errors.push('CTA link must start with http:// or https://');

  return { brief, errors };
}

module.exports = { validateBrief, cleanText, AUDIENCES, OBJECTIVES, TONES };
