// Human-approval workflow rules. Dependency-free so they can be unit tested.
// draft -> approved -> scheduled -> due | published      (rejected / failed are side states)
const { findPlaceholders } = require('./safety');

const ok = () => ({ ok: true });
const no = (error) => ({ ok: false, error });

function canEdit(draft) {
  if (draft.status === 'published') return no('Published drafts cannot be edited.');
  return ok();
}

function canApprove(draft) {
  if (draft.status !== 'draft') return no(`Only drafts awaiting review can be approved (current status: ${draft.status}).`);
  if (String(draft.text || '').trim().length < 40) return no('Draft is too short to approve.');
  const ph = findPlaceholders(draft.text);
  if (ph.length) return no(`Resolve ${ph.length} placeholder(s) before approving, for example ${ph[0]}.`);
  return ok();
}

function canReject(draft) {
  if (!['draft', 'approved', 'scheduled', 'due', 'failed'].includes(draft.status)) return no(`A draft with status "${draft.status}" cannot be rejected.`);
  return ok();
}

function canSchedule(draft, when, now = new Date()) {
  if (!['approved', 'scheduled'].includes(draft.status)) return no('Only approved drafts can be scheduled. A person must approve it first.');
  if (!draft.approvedAt) return no('Draft has no approval record.');
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return no('Provide a valid date and time.');
  if (d.getTime() < now.getTime() + 60 * 1000) return no('Schedule time must be at least one minute in the future.');
  if (d.getTime() > now.getTime() + 366 * 24 * 3600 * 1000) return no('Schedule time must be within the next year.');
  return ok();
}

function canMarkPublished(draft) {
  if (!['approved', 'scheduled', 'due'].includes(draft.status) || !draft.approvedAt) return no('Only approved drafts can be marked as published.');
  return ok();
}

function canRecordMetrics(draft) {
  if (draft.status !== 'published') return no('Metrics can only be recorded for published drafts.');
  return ok();
}

function cleanMetric(v) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n) || n > 1e12) throw new Error('Metrics must be whole numbers of zero or more.');
  return n;
}

module.exports = { canEdit, canApprove, canReject, canSchedule, canMarkPublished, canRecordMetrics, cleanMetric };
