import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api.js';

const AUDIENCES = [
  ['leaders', 'School leaders'],
  ['teachers', 'Teachers'],
  ['parents', 'Parents'],
  ['children', 'Children']
];
const OBJECTIVES = ['AWARENESS', 'ENGAGEMENT', 'REGISTRATION', 'EVENT PROMOTION', 'LEAD GENERATION'];
const TONES = ['warm', 'professional', 'playful', 'inspiring'];

const EMPTY = {
  topic: '', campaign: '', description: '', audiences: [], objective: 'AWARENESS', tone: 'warm',
  keyMessage: '', eventDetails: '', link: '', handle: '', ageRange: '', activity: ''
};

export default function Generator() {
  const nav = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleAud = (v) => setForm((f) => ({
    ...f, audiences: f.audiences.includes(v) ? f.audiences.filter((a) => a !== v) : [...f.audiences, v]
  }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/content/generate', form);
      nav(`/content/${data._id}`);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  const needsDetails = form.objective === 'REGISTRATION' || form.objective === 'EVENT PROMOTION';

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="card space-y-4 lg:col-span-2">
        <div>
          <h1 className="text-xl font-bold">New campaign content</h1>
          <p className="text-sm text-slate-500">Enter only facts you have confirmed. Anything left blank is flagged for verification, never invented.</p>
        </div>
        {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="topic">Topic</label><input id="topic" className="input" value={form.topic} onChange={set('topic')} /></div>
          <div><label className="label" htmlFor="campaign">Campaign name</label><input id="campaign" className="input" value={form.campaign} onChange={set('campaign')} /></div>
        </div>
        <div><label className="label" htmlFor="description">Description</label><textarea id="description" rows={3} className="input" value={form.description} onChange={set('description')} /></div>

        <fieldset>
          <legend className="label">Target audiences (choose at least one)</legend>
          <div className="flex flex-wrap gap-4">
            {AUDIENCES.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.audiences.includes(v)} onChange={() => toggleAud(v)} /> {l}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="objective">Objective</label>
            <select id="objective" className="input" value={form.objective} onChange={set('objective')}>{OBJECTIVES.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div><label className="label" htmlFor="tone">Tone</label>
            <select id="tone" className="input" value={form.tone} onChange={set('tone')}>{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        <div><label className="label" htmlFor="keyMessage">Key message</label><input id="keyMessage" className="input" value={form.keyMessage} onChange={set('keyMessage')} /></div>
        <div>
          <label className="label" htmlFor="eventDetails">Dates, venue, eligibility, fees (only if confirmed){needsDetails && ' - needed for this objective'}</label>
          <textarea id="eventDetails" rows={2} className="input" value={form.eventDetails} onChange={set('eventDetails')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="link">CTA link</label><input id="link" className="input" placeholder="https://" value={form.link} onChange={set('link')} /></div>
          <div><label className="label" htmlFor="handle">Social handle</label><input id="handle" className="input" placeholder="@" value={form.handle} onChange={set('handle')} /></div>
          <div><label className="label" htmlFor="ageRange">Child age range (video)</label><input id="ageRange" className="input" value={form.ageRange} onChange={set('ageRange')} /></div>
          <div><label className="label" htmlFor="activity">Hands-on activity (video)</label><input id="activity" className="input" value={form.activity} onChange={set('activity')} /></div>
        </div>

        <button className="btn btn-primary" disabled={busy}>{busy ? 'Generating drafts...' : 'Generate drafts'}</button>
      </div>

      <aside className="card h-fit space-y-3 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">How this works</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Gemini writes four platform-native drafts from your brief.</li>
          <li>A safety layer flags invented numbers, guarantees, placeholders and personal data.</li>
          <li>You edit and approve each draft. Unresolved placeholders block approval.</li>
          <li>Only approved drafts can be scheduled.</li>
          <li>By default a person posts them and records it, so nothing publishes automatically.</li>
        </ol>
      </aside>
    </form>
  );
}
