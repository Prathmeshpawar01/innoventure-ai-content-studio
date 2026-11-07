import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const NAMES = { linkedin: 'LinkedIn', instagram: 'Instagram', shorts: 'Shorts', newsletter: 'Newsletter' };

export default function Library() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api.get('/content', { params: { page } })
      .then((r) => live && setData(r.data))
      .catch((e) => live && setError(errorMessage(e)));
    return () => { live = false; };
  }, [page]);

  if (error) return <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!data) return <p className="text-slate-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Content library</h1>
      {data.items.length === 0 && <div className="card text-slate-500">Nothing yet. Create your first campaign content.</div>}
      {data.items.map((it) => (
        <Link key={it._id} to={`/content/${it._id}`} className="card block hover:border-brand-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">{it.brief.campaign || it.brief.topic || 'Untitled campaign'}</div>
            <div className="text-xs text-slate-500">{new Date(it.createdAt).toLocaleString()} - {it.source}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {it.drafts.map((d) => (
              <div key={d.platform} className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">{NAMES[d.platform]}</span><StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </Link>
      ))}
      {data.pages > 1 && (
        <div className="flex items-center gap-3">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-slate-500">Page {data.page} of {data.pages}</span>
          <button className="btn" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
