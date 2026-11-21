import React from 'react';

const STATUS_CONFIG = {
  COMPLETED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Completed in records',
  },
  ONGOING: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Reported Ongoing',
  },
  DELAYED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Timeline Overrun',
  },
  PLANNED: {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Sanctioned / Planned',
  },
  SUSPENDED: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Work Suspended',
  },
};

export default function StatusBadge({ status }) {
  const norm = (status || 'ONGOING').toUpperCase();
  const config = STATUS_CONFIG[norm] || STATUS_CONFIG.ONGOING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
