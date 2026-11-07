import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const PLATFORMS = [['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['shorts', 'YouTube Shorts'], ['newsletter', 'Newsletter']];
const LIMITS = { linkedin: 3000, instagram: 2200, shorts: 5000 };
const PLACEHOLDER_RE = /\[VERIFY[^\]]*\]|\[[A-Z][A-Z0-9 /'-]{2,}\]/g;

function toLocalInput(d) {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export default function Review() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [active, setActive] = useState('linkedin');
  const [text, setText] = useState('');
  const [when, setWhen] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [metrics, setMetrics] = useState({ impressions: '', engagements: '', clicks: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const draft = item && item.drafts.find((d) => d.platform === active);

  const sync = useCallback((it, platform) => {
    const d = it.drafts.find((x) => x.platform === platform);
    setItem(it);
    setText(d ? d.text : '');
    setWhen(d && d.scheduledFor ? toLocalInput(d.scheduledFor) : '');
    setPostUrl(d && d.postUrl ? d.postUrl : '');
    setMetrics({
      impressions: d && d.metrics && d.metrics.impressions != null ? String(d.metrics.impressions) : '',
      engagements: d && d.metrics && d.metrics.engagements != null ? String(d.metrics.engagements) : '',
      clicks: d && d.metrics && d.metrics.clicks != null ? String(d.metrics.clicks) : ''
    });
  }, []);

  useEffect(() => {
    api.get(`/content/${id}`).then((r) => sync(r.data, 'linkedin')).catch((e) => setError(errorMessage(e)));
  }, [id, sync]);

  function switchTab(p) {
    setActive(p); setError(''); setNotice('');
    if (item) sync(item, p);
  }

  async function run(label, fn) {
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await fn(); sync(data, active); setNotice(label); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  const base = `/content/${id}/drafts/${active}`;
  const placeholders = (text.match(PLACEHOLDER_RE) || []);
  const dirty = draft && text !== draft.text;
  const limit = LIMITS[active];

  async function remove() {
    if (!window.confirm('Delete this content and all its drafts?')) return;
    try { await api.delete(`/content/${id}`); nav('/library'); } catch (e) { setError(errorMessage(e)); }
  }

  if (!item) return error ? <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : <p className="text-slate-500">Loading...</p>;

  const myWarnings = item.warnings.filter((w) => w.where.split(' + ').includes(active) || w.where === 'Your brief');

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{item.brief.campaign || item.brief.topic || 'Untitled campaign'}</h1>
            <p className="text-xs text-slate-500">Written by {item.source === 'gemini' ? `Gemini (${item.model})` : 'built-in templates'}. Draft only: nothing is published automatically.</p>
          </div>
          <button className="btn btn-danger" onClick={remove}>Delete</button>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {PLATFORMS.map(([p, label]) => {
            const d = item.drafts.find((x) => x.platform === p);
            return (
              <button key={p} role="tab" aria-selected={p === active} onClick={() => switchTab(p)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${p === active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                {label} {d && <StatusBadge status={d.status} />}
              </button>
            );
          })}
        </div>

        {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

        <div className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{text.length} characters{limit ? ` (limit about ${limit})${text.length > limit ? ' - TOO LONG' : ''}` : ''}</span>
            <span>{placeholders.length ? `${placeholders.length} placeholder(s) to resolve before approval` : 'No placeholders left'}</span>
          </div>
          <textarea aria-label="Draft text" rows={20} className="input font-mono text-[13px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} disabled={draft.status === 'published'} />
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={busy || !dirty || draft.status === 'published'} onClick={() => run('Edits saved. Approval was reset, so review and approve again.', () => api.patch(base, { text }))}>Save edits</button>
            <button className="btn btn-primary" disabled={busy || dirty || draft.status !== 'draft'} title={dirty ? 'Save your edits first' : ''} onClick={() => run('Approved by a human reviewer.', () => api.post(`${base}/approve`))}>Approve</button>
            <button className="btn btn-danger" disabled={busy || !['draft', 'approved', 'scheduled', 'due', 'failed'].includes(draft.status)} onClick={() => run('Draft rejected.', () => api.post(`${base}/reject`))}>Reject</button>
            <button className="btn" onClick={() => navigator.clipboard && navigator.clipboard.writeText(text)}>Copy text</button>
          </div>
          {draft.status === 'rejected' && <p className="text-sm text-slate-500">Rejected. Edit and save the text to send it back for review.</p>}
        </div>

        {['approved', 'scheduled'].includes(draft.status) && (
          <div className="card space-y-3">
            <h2 className="font-semibold">Schedule</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div><label className="label" htmlFor="when">Date and time (your local time)</label>
                <input id="when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
              <button className="btn btn-primary" disabled={busy || !when} onClick={() => run('Scheduled.', () => api.post(`${base}/schedule`, { scheduledFor: new Date(when).toISOString() }))}>
                {draft.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
              </button>
            </div>
            <p className="text-xs text-slate-500">When the time arrives the draft becomes "due" so a person can post it. Automatic posting only happens if the server is switched to live mode with a platform adapter.</p>
          </div>
        )}

        {['approved', 'scheduled', 'due'].includes(draft.status) && (
          <div className="card space-y-3">
            <h2 className="font-semibold">Record that it was posted</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[16rem] flex-1"><label className="label" htmlFor="postUrl">Post URL (optional)</label>
                <input id="postUrl" className="input" placeholder="https://" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} /></div>
              <button className="btn btn-primary" disabled={busy} onClick={() => run('Marked as published.', () => api.post(`${base}/mark-published`, { postUrl }))}>Mark as published</button>
            </div>
          </div>
        )}

        {draft.status === 'published' && (
          <div className="card space-y-3">
            <h2 className="font-semibold">Results (type in from the platform's own analytics)</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {['impressions', 'engagements', 'clicks'].map((k) => (
                <div key={k}><label className="label capitalize" htmlFor={k}>{k}</label>
                  <input id={k} inputMode="numeric" className="input" value={metrics[k]} onChange={(e) => setMetrics((m) => ({ ...m, [k]: e.target.value }))} /></div>
              ))}
            </div>
            <button className="btn btn-primary" disabled={busy} onClick={() => run('Metrics saved.', () => api.post(`${base}/metrics`, metrics))}>Save results</button>
            {draft.postUrl && <p className="text-xs"><a className="text-brand-600 underline" href={draft.postUrl} target="_blank" rel="noreferrer noopener">Open post</a></p>}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        {item.flags.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <h2 className="mb-1 font-semibold">Needs human verification</h2>
            <ul className="list-disc space-y-1 pl-5">{item.flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}
        {myWarnings.length > 0 ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-900">
            <h2 className="mb-1 font-semibold">Safety review ({PLATFORMS.find(([p]) => p === active)[1]})</h2>
            <ul className="list-disc space-y-1 pl-5">{myWarnings.map((w, i) => <li key={i}>{w.msg}</li>)}</ul>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">No automatic safety warnings for this draft. A human review is still required.</div>
        )}
        {item.assumptions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <h2 className="mb-1 font-semibold text-slate-800">Notes</h2>
            <ul className="list-disc space-y-1 pl-5">{item.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        )}
      </aside>
    </div>
  );
}
