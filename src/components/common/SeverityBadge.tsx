import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Confidence, FindingStatus, Severity } from '../../types/index.ts';

export const SeverityTag: React.FC<{ severity: Severity }> = ({ severity }) => {
  const config: Record<
    Severity,
    { classes: string; icon: React.ReactNode; label: string }
  > = {
    CRITICAL: {
      classes:
        'bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/30',
      icon: <AlertOctagon className="w-3.5 h-3.5 shrink-0" />,
      label: 'CRITICAL',
    },
    HIGH: {
      classes:
        'bg-orange-500/12 text-orange-700 dark:text-orange-400 border-orange-500/30',
      icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" />,
      label: 'HIGH',
    },
    MEDIUM: {
      classes:
        'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      label: 'MEDIUM',
    },
    LOW: {
      classes:
        'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30',
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
      label: 'LOW',
    },
    INFO: {
      classes:
        'bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/30',
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
      label: 'INFO',
    },
  };

  const c = config[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wide border rounded whitespace-nowrap shrink-0 ${c.classes}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

export const ConfidenceLabel: React.FC<{ confidence: Confidence }> = ({
  confidence,
}) => {
  const styles: Record<Confidence, string> = {
    High: 'text-emerald-700 dark:text-emerald-400',
    Medium: 'text-amber-700 dark:text-amber-300',
    Low: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <span className={`text-xs font-medium whitespace-nowrap ${styles[confidence]}`}>
      {confidence} confidence
    </span>
  );
};

export const StatusLabel: React.FC<{ status: FindingStatus }> = ({ status }) => {
  const map: Record<
    FindingStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    OPEN: {
      classes: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/25',
      icon: <ShieldAlert className="w-3 h-3 shrink-0" />,
    },
    REVIEWED: {
      classes: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
      icon: <Eye className="w-3 h-3 shrink-0" />,
    },
    'FALSE POSITIVE': {
      classes: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
      icon: <XCircle className="w-3 h-3 shrink-0" />,
    },
    'ACCEPTED RISK': {
      classes: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
      icon: <AlertTriangle className="w-3 h-3 shrink-0" />,
    },
    RESOLVED: {
      classes: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
    },
  };

  const s = map[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium border rounded whitespace-nowrap shrink-0 ${s.classes}`}
    >
      {s.icon}
      {status}
    </span>
  );
};

export const DemoMarker: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold border border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300 rounded whitespace-nowrap shrink-0">
    <ShieldCheck className="w-3 h-3" />
    DEMO
  </span>
);
