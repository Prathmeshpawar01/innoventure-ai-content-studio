const Content = require('../models/Content');
const config = require('../config');
const distribution = require('./distribution');

let running = false;

// Moves scheduled drafts whose time has arrived. Only drafts a human APPROVED and scheduled are ever touched.
async function tick() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const items = await Content.find({ drafts: { $elemMatch: { status: 'scheduled', scheduledFor: { $lte: now } } } });
    for (const item of items) {
      for (const draft of item.drafts) {
        if (draft.status !== 'scheduled' || !draft.scheduledFor || draft.scheduledFor > now) continue;
        if (!draft.approvedAt) { draft.status = 'draft'; continue; } // safety net: never act on unapproved text
        if (config.distributionMode === 'live') {
          try {
            const result = await distribution.publish(draft.platform, draft.text, item.brief);
            draft.status = 'published';
            draft.publishedAt = new Date();
            draft.postUrl = result && result.url ? String(result.url).slice(0, 500) : undefined;
          } catch (err) {
            draft.status = 'failed';
            draft.failureReason = String(err.message).slice(0, 500);
          }
        } else {
          draft.status = 'due'; // a person posts it manually, then marks it published
        }
      }
      await item.save();
    }
  } catch (err) {
    console.error('[scheduler]', err.message);
  } finally {
    running = false;
  }
}

function start(intervalMs = 60 * 1000) {
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  tick();
  return timer;
}

module.exports = { start, tick };
