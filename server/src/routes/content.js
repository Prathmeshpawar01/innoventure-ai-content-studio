const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const requireAdmin = require('../middleware/auth');
const Content = require('../models/Content');
const { PLATFORMS } = require('../models/Content');
const { validateBrief } = require('../services/validate');
const gemini = require('../services/gemini');
const template = require('../services/templateGenerator');
const { reviewDrafts } = require('../services/safety');
const wf = require('../services/workflow');

const router = express.Router();
router.use(requireAdmin);

const generateLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many generations. Wait a minute.' } });

function badRequest(res, msg, code = 400) { return res.status(code).json({ error: msg }); }

async function load(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { badRequest(res, 'Invalid id.'); return null; }
  const item = await Content.findOne({ _id: req.params.id, createdBy: req.adminId });
  if (!item) { res.status(404).json({ error: 'Content not found.' }); return null; }
  return item;
}
function findDraft(item, req, res) {
  const platform = req.params.platform;
  if (!PLATFORMS.includes(platform)) { badRequest(res, 'Unknown platform.'); return null; }
  const draft = item.drafts.find((d) => d.platform === platform);
  if (!draft) { res.status(404).json({ error: 'Draft not found.' }); return null; }
  return draft;
}
function clearApproval(draft) {
  draft.approvedBy = undefined; draft.approvedAt = undefined; draft.scheduledFor = undefined; draft.failureReason = undefined;
}

// ---- Generate: brief -> Gemini (or template fallback) -> safety review -> saved as DRAFT ----
router.post('/generate', generateLimiter, async (req, res, next) => {
  try {
    const { brief, errors } = validateBrief(req.body);
    if (errors.length) return badRequest(res, errors.join(' '));

    let drafts; let source; let model; const notes = [];
    if (gemini.isConfigured()) {
      try {
        const out = await gemini.generateDrafts(brief);
        drafts = out.drafts; model = out.model; source = 'gemini';
      } catch (err) {
        notes.push(`Gemini was unavailable (${err.message}). Built-in templates were used instead.`);
      }
    } else {
      notes.push('Gemini is not configured (set GEMINI_API_KEY and GEMINI_MODEL). Built-in templates were used.');
    }

    let tplFlags = []; let tplAssumptions = [];
    if (!drafts) {
      const t = template.generate(brief);
      drafts = t.drafts; tplFlags = t.flags; tplAssumptions = t.assumptions; source = 'template';
    }

    const review = reviewDrafts(brief, drafts);
    const item = await Content.create({
      createdBy: req.adminId,
      brief,
      drafts: PLATFORMS.map((p) => ({ platform: p, text: drafts[p], status: 'draft' })),
      flags: [...tplFlags.map((f) => `Verify: ${f}`), ...review.flags],
      assumptions: [...notes, ...tplAssumptions],
      warnings: review.warnings,
      source,
      model
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = { createdBy: req.adminId };
    const [items, total] = await Promise.all([
      Content.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('brief.campaign brief.topic source createdAt drafts.platform drafts.status drafts.scheduledFor'),
      Content.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { const item = await load(req, res); if (item) res.json(item); } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    if (item.drafts.some((d) => d.status === 'published')) return badRequest(res, 'Content with published drafts cannot be deleted (it is part of your analytics).', 409);
    await item.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Edit text (resets approval) ----
router.patch('/:id/drafts/:platform', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const check = wf.canEdit(draft); if (!check.ok) return badRequest(res, check.error, 409);
    const text = String((req.body && req.body.text) || '').trim();
    if (text.length < 40) return badRequest(res, 'Draft text is too short.');
    if (text.length > 20000) return badRequest(res, 'Draft text is too long.');
    draft.text = text; draft.status = 'draft'; clearApproval(draft);
    const review = reviewDrafts(item.brief.toObject(), { [draft.platform]: text });
    item.warnings = item.warnings.filter((w) => w.where !== draft.platform).concat(review.warnings);
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

// ---- Human approval ----
router.post('/:id/drafts/:platform/approve', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const check = wf.canApprove(draft); if (!check.ok) return badRequest(res, check.error, 422);
    draft.status = 'approved'; draft.approvedBy = req.adminId; draft.approvedAt = new Date();
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

router.post('/:id/drafts/:platform/reject', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const check = wf.canReject(draft); if (!check.ok) return badRequest(res, check.error, 409);
    draft.status = 'rejected'; clearApproval(draft);
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

// ---- Scheduling (approved drafts only) ----
router.post('/:id/drafts/:platform/schedule', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const when = req.body && req.body.scheduledFor;
    const check = wf.canSchedule(draft, when); if (!check.ok) return badRequest(res, check.error, 422);
    draft.status = 'scheduled'; draft.scheduledFor = new Date(when);
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

// ---- A person posted it manually and records it here ----
router.post('/:id/drafts/:platform/mark-published', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const check = wf.canMarkPublished(draft); if (!check.ok) return badRequest(res, check.error, 422);
    const url = String((req.body && req.body.postUrl) || '').trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) return badRequest(res, 'Post URL must start with http:// or https://');
    draft.status = 'published'; draft.publishedAt = new Date(); draft.postUrl = url || undefined; draft.scheduledFor = draft.scheduledFor;
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

// ---- Engagement numbers typed in from the platform's own analytics ----
router.post('/:id/drafts/:platform/metrics', async (req, res, next) => {
  try {
    const item = await load(req, res); if (!item) return;
    const draft = findDraft(item, req, res); if (!draft) return;
    const check = wf.canRecordMetrics(draft); if (!check.ok) return badRequest(res, check.error, 422);
    let m;
    try {
      m = { impressions: wf.cleanMetric(req.body.impressions), engagements: wf.cleanMetric(req.body.engagements), clicks: wf.cleanMetric(req.body.clicks) };
    } catch (err) { return badRequest(res, err.message); }
    draft.metrics = { ...m, updatedAt: new Date() };
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

module.exports = router;
