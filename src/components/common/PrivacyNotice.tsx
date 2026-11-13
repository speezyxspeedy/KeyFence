import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>LOCAL PROCESSING — YOUR FILES STAY IN YOUR BROWSER</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border border-emerald-500/25 bg-emerald-500/6 dark:bg-emerald-500/8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-mono font-semibold tracking-wide text-emerald-800 dark:text-emerald-300">
            LOCAL PROCESSING — YOUR FILES STAY IN YOUR BROWSER
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            All file reads, ZIP extraction, pattern matching, and entropy checks run offline in browser memory. Zero uploads, zero external verification calls, zero raw secret storage.
          </p>
        </div>
      </div>
    </div>
  );
};
