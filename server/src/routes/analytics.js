const express = require('express');
const mongoose = require('mongoose');
const requireAdmin = require('../middleware/auth');
const Content = require('../models/Content');

const router = express.Router();
router.use(requireAdmin);

// All figures come from this app's own database. Engagement totals are only what people typed in from platform analytics.
router.get('/summary', async (req, res, next) => {
  try {
    const owner = new mongoose.Types.ObjectId(req.adminId);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [statusRows, perDay, sourceRows, approvalRows, metricRows, contentCount] = await Promise.all([
      Content.aggregate([
        { $match: { createdBy: owner } }, { $unwind: '$drafts' },
        { $group: { _id: { platform: '$drafts.platform', status: '$drafts.status' }, n: { $sum: 1 } } }
      ]),
      Content.aggregate([
        { $match: { createdBy: owner, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Content.aggregate([{ $match: { createdBy: owner } }, { $group: { _id: '$source', n: { $sum: 1 } } }]),
      Content.aggregate([
        { $match: { createdBy: owner } }, { $unwind: '$drafts' },
        { $match: { 'drafts.approvedAt': { $exists: true } } },
        { $group: { _id: null, n: { $sum: 1 }, avgMs: { $avg: { $subtract: ['$drafts.approvedAt', '$createdAt'] } } } }
      ]),
      Content.aggregate([
        { $match: { createdBy: owner } }, { $unwind: '$drafts' },
        { $match: { 'drafts.status': 'published' } },
        { $group: {
          _id: '$drafts.platform', published: { $sum: 1 },
          impressions: { $sum: { $ifNull: ['$drafts.metrics.impressions', 0] } },
          engagements: { $sum: { $ifNull: ['$drafts.metrics.engagements', 0] } },
          clicks: { $sum: { $ifNull: ['$drafts.metrics.clicks', 0] } },
          withMetrics: { $sum: { $cond: [{ $ifNull: ['$drafts.metrics.updatedAt', false] }, 1, 0] } }
        } }
      ]),
      Content.countDocuments({ createdBy: owner })
    ]);

    const byPlatformStatus = {};
    const totals = {};
    statusRows.forEach((r) => {
      byPlatformStatus[r._id.platform] = byPlatformStatus[r._id.platform] || {};
      byPlatformStatus[r._id.platform][r._id.status] = r.n;
      totals[r._id.status] = (totals[r._id.status] || 0) + r.n;
    });
    const draftsTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    const approvedEver = approvalRows[0] ? approvalRows[0].n : 0;

    res.json({
      contentCount,
      draftsTotal,
      totals,
      byPlatformStatus,
      createdPerDay: perDay.map((r) => ({ date: r._id, count: r.n })),
      source: Object.fromEntries(sourceRows.map((r) => [r._id, r.n])),
      approvalRate: draftsTotal ? approvedEver / draftsTotal : null,
      avgHoursToApproval: approvalRows[0] && approvalRows[0].avgMs != null ? approvalRows[0].avgMs / 3600000 : null,
      engagement: metricRows.map((r) => ({
        platform: r._id, published: r.published, impressions: r.impressions,
        engagements: r.engagements, clicks: r.clicks, postsWithMetrics: r.withMetrics
      }))
    });
  } catch (e) { next(e); }
});

module.exports = router;
