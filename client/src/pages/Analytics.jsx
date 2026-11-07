import React, { useEffect, useState } from 'react';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api, { errorMessage } from '../api.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const PLATFORMS = ['linkedin', 'instagram', 'shorts', 'newsletter'];
const NAMES = { linkedin: 'LinkedIn', instagram: 'Instagram', shorts: 'Shorts', newsletter: 'Newsletter' };
const STATUSES = ['draft', 'approved', 'scheduled', 'due', 'published', 'rejected', 'failed'];
const COLORS = { draft: '#f59e0b', approved: '#10b981', scheduled: '#0ea5e9', due: '#8b5cf6', published: '#1e293b', rejected: '#ef4444', failed: '#b91c1c' };

function Stat({ label, value, hint }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default function Analytics() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/summary').then((r) => setD(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!d) return <p className="text-slate-500">Loading...</p>;
  if (d.draftsTotal === 0) return <div className="card text-slate-500">No data yet. Analytics appear once you have generated content.</div>;

  const statusData = {
    labels: PLATFORMS.map((p) => NAMES[p]),
    datasets: STATUSES.map((s) => ({
      label: s,
      backgroundColor: COLORS[s],
      data: PLATFORMS.map((p) => (d.byPlatformStatus[p] && d.byPlatformStatus[p][s]) || 0)
    }))
  };
  const perDay = {
    labels: d.createdPerDay.map((r) => r.date),
    datasets: [{ label: 'Content created', data: d.createdPerDay.map((r) => r.count), borderColor: '#4b3fd1', backgroundColor: '#4b3fd1', tension: 0.25 }]
  };
  const srcKeys = Object.keys(d.source);
  const sourceData = {
    labels: srcKeys.map((k) => (k === 'gemini' ? 'Gemini' : 'Templates')),
    datasets: [{ data: srcKeys.map((k) => d.source[k]), backgroundColor: ['#4b3fd1', '#94a3b8'] }]
  };
  const pct = (v) => (v == null ? '-' : `${Math.round(v * 100)}%`);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Campaigns" value={d.contentCount} />
        <Stat label="Drafts" value={d.draftsTotal} />
        <Stat label="Ever approved by a human" value={pct(d.approvalRate)} hint="of all drafts" />
        <Stat label="Avg. time to approval" value={d.avgHoursToApproval == null ? '-' : `${d.avgHoursToApproval.toFixed(1)} h`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card"><h2 className="mb-3 font-semibold">Drafts by platform and status</h2>
          <Bar data={statusData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true, ticks: { precision: 0 } } } }} /></div>
        <div className="card"><h2 className="mb-3 font-semibold">Content created, last 30 days</h2>
          <Line data={perDay} options={{ responsive: true, scales: { y: { ticks: { precision: 0 }, beginAtZero: true } } }} /></div>
        <div className="card"><h2 className="mb-3 font-semibold">How drafts were written</h2>
          <div className="mx-auto max-w-xs"><Doughnut data={sourceData} /></div></div>
        <div className="card">
          <h2 className="mb-1 font-semibold">Engagement (entered by your team)</h2>
          <p className="mb-3 text-xs text-slate-500">These totals only include numbers you typed in from each platform. The app does not read platform analytics.</p>
          {d.engagement.length === 0 ? <p className="text-sm text-slate-500">Nothing published yet.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500"><tr><th className="py-1">Platform</th><th>Posts</th><th>Impressions</th><th>Engagements</th><th>Clicks</th></tr></thead>
              <tbody>
                {d.engagement.map((r) => (
                  <tr key={r.platform} className="border-t border-slate-100">
                    <td className="py-1">{NAMES[r.platform]}</td>
                    <td>{r.published} <span className="text-xs text-slate-400">({r.postsWithMetrics} with data)</span></td>
                    <td>{r.impressions.toLocaleString()}</td><td>{r.engagements.toLocaleString()}</td><td>{r.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
