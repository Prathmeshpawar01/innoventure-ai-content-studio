const mongoose = require('mongoose');

const PLATFORMS = ['linkedin', 'instagram', 'shorts', 'newsletter'];
// draft -> approved -> scheduled -> due (manual) / published ; rejected and failed are side states
const STATUSES = ['draft', 'approved', 'rejected', 'scheduled', 'due', 'published', 'failed'];

const DraftSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: PLATFORMS, required: true },
    text: { type: String, required: true, maxlength: 20000 },
    status: { type: String, enum: STATUSES, default: 'draft' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: Date,
    scheduledFor: Date,
    publishedAt: Date,
    postUrl: { type: String, maxlength: 500 },
    failureReason: { type: String, maxlength: 500 },
    // Engagement numbers are typed in by a person from the platform's own analytics. Never estimated.
    metrics: {
      impressions: { type: Number, min: 0 },
      engagements: { type: Number, min: 0 },
      clicks: { type: Number, min: 0 },
      updatedAt: Date
    }
  },
  { _id: false }
);

const ContentSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    brief: {
      topic: String,
      campaign: String,
      description: String,
      audiences: [String],
      objective: String,
      keyMessage: String,
      tone: String,
      eventDetails: String,
      link: String,
      handle: String,
      ageRange: String,
      activity: String
    },
    drafts: [DraftSchema],
    flags: [String],
    assumptions: [String],
    warnings: [{ where: String, msg: String, _id: false }],
    source: { type: String, enum: ['gemini', 'template'], required: true },
    model: String
  },
  { timestamps: true }
);

ContentSchema.index({ 'drafts.status': 1, 'drafts.scheduledFor': 1 });

module.exports = mongoose.model('Content', ContentSchema);
module.exports.PLATFORMS = PLATFORMS;
module.exports.STATUSES = STATUSES;
