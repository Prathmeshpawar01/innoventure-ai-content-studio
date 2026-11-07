import React from 'react';

const STYLE = {
  draft: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  scheduled: 'bg-sky-100 text-sky-800',
  due: 'bg-violet-100 text-violet-800',
  published: 'bg-slate-800 text-white',
  failed: 'bg-red-200 text-red-900'
};
const LABEL = { due: 'due - post manually' };

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status] || 'bg-slate-100 text-slate-700'}`}>
      {LABEL[status] || status}
    </span>
  );
}
