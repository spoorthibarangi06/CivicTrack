import React from 'react';

const ORIGIN_CONFIG = {
  LIVE_API: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-600',
    label: 'LIVE API',
  },
  OFFICIAL_REPORT_IMPORT: {
    bg: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-600',
    label: 'OFFICIAL REPORT IMPORT',
  },
  SAMPLE_DATA: {
    bg: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
    label: 'SAMPLE / DEMO DATA',
  },
};

export default function OriginBadge({ origin, className = '' }) {
  const norm = (origin || 'SAMPLE_DATA').toUpperCase();
  const config = ORIGIN_CONFIG[norm] || ORIGIN_CONFIG.SAMPLE_DATA;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${config.bg} ${className}`}
      title={`Data Origin: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
