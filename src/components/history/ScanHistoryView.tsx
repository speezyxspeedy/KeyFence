import React, { useMemo, useState } from 'react';
import { History, ShieldCheck, Trash2 } from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { DemoMarker } from '../common/SeverityBadge.tsx';

export const ScanHistoryView: React.FC = () => {
  const { history, removeHistoryEntry, clearHistory, setActiveTab } =
    useScanner();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = (scanId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(scanId)) return prev.filter((id) => id !== scanId);
      if (prev.length >= 2) return [prev[1], scanId];
      return [...prev, scanId];
    });
  };

  const comparedEntries = useMemo(
    () =>
      compareIds
        .map((id) => history.find((h) => h.scanId === id))
        .filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [compareIds, history]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
            Local Scan History
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Browser-local metadata summaries only. Raw credentials, file contents, and unmasked previews are never stored.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setCompareIds([]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/10 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/8 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>
          History entries reside exclusively in your browser&apos;s local storage and contain only aggregate counts and timestamps.
        </span>
      </div>

      {comparedEntries.length === 2 && (
        <section className="rounded-lg border border-sky-500/35 bg-white dark:bg-[#11151B] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              Scan Comparison
            </h2>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Clear selection
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparedEntries.map((entry) => (
              <div
                key={entry.scanId}
                className="p-4 rounded border border-slate-200 dark:border-[#222933] bg-slate-50 dark:bg-[#0B0D10] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-[#E6EDF3]">
                    {entry.projectLabel}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-[#8B949E]">
                    {entry.scanId}
                  </span>
                </div>
                <p className="font-mono text-slate-500 dark:text-[#8B949E]">
                  {new Date(entry.scanDate).toLocaleString()}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-[#222933] font-mono tabular-nums">
                  <div>
                    <span className="text-slate-500 block">Scanned</span>
                    <strong className="text-slate-900 dark:text-[#E6EDF3]">
                      {entry.filesScanned}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Findings</span>
                    <strong className="text-slate-900 dark:text-[#E6EDF3]">
                      {entry.findingsCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Crit / High</span>
                    <strong className="text-red-600 dark:text-red-400">
                      {entry.severitySummary.CRITICAL} / {entry.severitySummary.HIGH}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.length === 0 ? (
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-10 text-center space-y-3">
          <History className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-medium text-slate-800 dark:text-[#E6EDF3]">
            No Local Scan History Yet
          </p>
          <p className="text-xs text-slate-500 dark:text-[#8B949E]">
            Completed scans will log metadata summaries here for side-by-side comparison.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('new-scan')}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            Start a Scan
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E] border-b border-slate-200 dark:border-[#222933]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Compare</th>
                <th className="px-3 py-2.5 font-medium">Project</th>
                <th className="px-3 py-2.5 font-medium">Scan Date</th>
                <th className="px-3 py-2.5 font-medium text-right">Files Scanned</th>
                <th className="px-3 py-2.5 font-medium text-right">Findings</th>
                <th className="px-3 py-2.5 font-medium">Severity Breakdown</th>
                <th className="px-3 py-2.5 font-medium text-right">Duration</th>
                <th className="px-3 py-2.5 font-medium text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#222933]">
              {history.map((entry) => {
                const checked = compareIds.includes(entry.scanId);
                return (
                  <tr
                    key={entry.scanId}
                    className="hover:bg-slate-50 dark:hover:bg-[#161B22]"
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompare(entry.scanId)}
                        aria-label={`Select ${entry.scanId} for comparison`}
                        className="rounded border-slate-300 dark:border-[#30363D]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-[#E6EDF3]">
                          {entry.projectLabel}
                        </span>
                        {entry.isDemo && <DemoMarker />}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-[#8B949E]">
                        {entry.scanId}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-[#8B949E] whitespace-nowrap">
                      {new Date(entry.scanDate).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-right text-slate-800 dark:text-[#E6EDF3]">
                      {entry.filesScanned}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold tabular-nums text-right text-slate-900 dark:text-[#E6EDF3]">
                      {entry.findingsCount}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] tabular-nums whitespace-nowrap text-slate-600 dark:text-[#8B949E]">
                      C:{entry.severitySummary.CRITICAL} · H:{entry.severitySummary.HIGH} · M:{entry.severitySummary.MEDIUM} · L:{entry.severitySummary.LOW}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-right text-slate-600 dark:text-[#8B949E]">
                      {entry.durationMs} ms
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeHistoryEntry(entry.scanId)}
                        aria-label={`Delete scan history ${entry.scanId}`}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
