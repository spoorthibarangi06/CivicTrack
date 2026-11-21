import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const RISK_CONFIG = {
  LOW: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'Low Delay Risk',
  },
  MEDIUM: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
    label: 'Moderate Risk',
  },
  HIGH: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'High Risk (Requires Review)',
  },
};

export default function RiskBadge({ level, score, showScore = true }) {
  const norm = (level || 'LOW').toUpperCase();
  const config = RISK_CONFIG[norm] || RISK_CONFIG.LOW;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {showScore && score !== undefined && score !== null && (
        <span className="opacity-75 text-[11px] font-mono">({Math.round(score * 100)}%)</span>
      )}
    </span>
  );
}
