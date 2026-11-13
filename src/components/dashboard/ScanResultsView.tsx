import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileWarning,
  ShieldCheck,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import {
  getCategoryBreakdown,
  getMostAffectedFiles,
} from '../../services/findingsService.ts';
import { formatBytes } from '../../services/fileService.ts';
import { DemoMarker, SeverityTag } from '../common/SeverityBadge.tsx';
import { Severity } from '../../types/index.ts';

export const ScanResultsView: React.FC = () => {
  const {
    currentSummary,
    findings,
    skippedFiles,
    gitignoreAnalysis,
    setActiveTab,
    setFilters,
    loadAndRunDemoProject,
  } = useScanner();

  const [showSkipped, setShowSkipped] = useState(false);
  const [copiedGitignore, setCopiedGitignore] = useState(false);

  if (!currentSummary) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-10 text-center space-y-4">
        <FileWarning className="w-8 h-8 mx-auto text-slate-400" />
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            No Scan Results Available
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8B949E]">
            Run a local security scan on a project folder or ZIP archive, or load the fictional Demo Project to inspect real detection output.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('new-scan')}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            New Security Scan
          </button>
          <button
            type="button"
            onClick={loadAndRunDemoProject}
            className="px-4 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] text-slate-800 dark:text-[#E6EDF3] cursor-pointer"
          >
            LOAD DEMO PROJECT
          </button>
        </div>
      </div>
    );
  }

  const categories = getCategoryBreakdown(findings);
  const affectedFiles = getMostAffectedFiles(findings, 6);
  const maxSeverityCount = Math.max(
    1,
    currentSummary.severityCounts.CRITICAL,
    currentSummary.severityCounts.HIGH,
    currentSummary.severityCounts.MEDIUM,
    currentSummary.severityCounts.LOW,
    currentSummary.severityCounts.INFO
  );

  const severityRows: Array<{
    key: Severity;
    label: string;
    barClass: string;
    count: number;
  }> = [
    {
      key: 'CRITICAL',
      label: 'Critical',
      barClass: 'bg-red-500',
      count: currentSummary.severityCounts.CRITICAL,
    },
    {
      key: 'HIGH',
      label: 'High',
      barClass: 'bg-orange-500',
      count: currentSummary.severityCounts.HIGH,
    },
    {
      key: 'MEDIUM',
      label: 'Medium',
      barClass: 'bg-amber-500',
      count: currentSummary.severityCounts.MEDIUM,
    },
    {
      key: 'LOW',
      label: 'Low',
      barClass: 'bg-sky-500',
      count: currentSummary.severityCounts.LOW,
    },
    {
      key: 'INFO',
      label: 'Info',
      barClass: 'bg-slate-400',
      count: currentSummary.severityCounts.INFO,
    },
  ];

  const handleCopySuggestedGitignore = async () => {
    if (!gitignoreAnalysis || gitignoreAnalysis.suggestedRules.length === 0) return;
    try {
      await navigator.clipboard.writeText(gitignoreAnalysis.suggestedRules.join('\n'));
      setCopiedGitignore(true);
      setTimeout(() => setCopiedGitignore(false), 2000);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const inspectFileFindings = (filePath: string) => {
    setFilters((prev) => ({ ...prev, search: filePath }));
    setActiveTab('findings');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
              Scan Results Dashboard
            </h1>
            {currentSummary.isDemo && <DemoMarker />}
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-[#8B949E] mt-1 tabular-nums">
            {currentSummary.projectLabel} · {currentSummary.scanId} · Completed in {currentSummary.durationMs} ms
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-slate-800 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#1C222B] cursor-pointer"
          >
            Export Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            <span>Explore Findings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'Files Scanned',
            value: currentSummary.filesScanned,
            tone: 'text-slate-900 dark:text-[#E6EDF3]',
          },
          {
            label: 'Total Findings',
            value: currentSummary.totalFindings,
            tone: 'text-slate-900 dark:text-[#E6EDF3]',
          },
          {
            label: 'Critical',
            value: currentSummary.severityCounts.CRITICAL,
            tone: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'High Severity',
            value: currentSummary.severityCounts.HIGH,
            tone: 'text-orange-600 dark:text-orange-400',
          },
          {
            label: 'Medium Severity',
            value: currentSummary.severityCounts.MEDIUM,
            tone: 'text-amber-600 dark:text-amber-300',
          },
          {
            label: 'Low Severity',
            value: currentSummary.severityCounts.LOW,
            tone: 'text-sky-600 dark:text-sky-400',
          },
          {
            label: 'Files Skipped',
            value: currentSummary.filesSkipped,
            tone: 'text-slate-600 dark:text-[#8B949E]',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-4"
          >
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#8B949E] truncate">
              {kpi.label}
            </p>
            <p className={`text-2xl font-mono font-bold tabular-nums mt-1 ${kpi.tone}`}>
              {kpi.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {/* Main Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* A. Severity Distribution */}
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Severity Distribution
          </h2>
          <div className="space-y-3">
            {severityRows.map((row) => {
              const pct = Math.round((row.count / maxSeverityCount) * 100);
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, severity: row.key }));
                    setActiveTab('findings');
                  }}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-[#E6EDF3] group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {row.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-[#8B949E]">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-100 dark:bg-[#1A2029] overflow-hidden">
                    <div
                      className={`h-full ${row.barClass} transition-all duration-300`}
                      style={{ width: `${row.count > 0 ? Math.max(4, pct) : 0}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* B. Detection Categories */}
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Detection Categories
          </h2>
          {categories.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              No categories triggered during this scan.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#222933]">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, category: cat.category }));
                    setActiveTab('findings');
                  }}
                  className="w-full py-2 flex items-center justify-between text-xs hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span className="text-slate-700 dark:text-[#E6EDF3] truncate pr-2">
                    {cat.category}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* C. Scan Summary Metadata */}
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Scan Summary
          </h2>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Project Label</dt>
              <dd className="font-medium text-slate-900 dark:text-[#E6EDF3] text-right truncate">
                {currentSummary.projectLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Scan Duration</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {currentSummary.durationMs} ms
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Total Files Selected</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {currentSummary.totalFilesSelected.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Files Scanned</dt>
              <dd className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {currentSummary.filesScanned.toLocaleString()} ({formatBytes(currentSummary.totalBytesScanned)})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Files Skipped</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {currentSummary.filesSkipped.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-[#8B949E]">Rules Executed</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {currentSummary.rulesExecuted}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Most Affected Files & Gitignore Analyzer */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Affected Files */}
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Most Affected Files
          </h2>
          {affectedFiles.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              No potential secrets matched in the scanned files. Note: absence of matches does not guarantee a project is free of credentials.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#222933]">
              {affectedFiles.map((file) => (
                <button
                  key={file.filePath}
                  type="button"
                  onClick={() => inspectFileFindings(file.filePath)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-[#161B22] px-2 -mx-2 rounded transition-colors cursor-pointer"
                >
                  <span className="font-mono text-xs text-slate-800 dark:text-[#E6EDF3] truncate">
                    {file.filePath}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <SeverityTag severity={file.highestSeverity} />
                    <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-[#8B949E]">
                      {file.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gitignore Coverage Analyzer */}
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
                .gitignore Coverage Analyzer
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5">
                {gitignoreAnalysis?.hasGitignore
                  ? `Parsed ${gitignoreAnalysis.parsedPatternsCount} pattern(s) from ${gitignoreAnalysis.gitignoreFiles.join(', ')}`
                  : 'No .gitignore file found in selected project files.'}
              </p>
            </div>

            {gitignoreAnalysis && gitignoreAnalysis.suggestedRules.length > 0 && (
              <button
                type="button"
                onClick={handleCopySuggestedGitignore}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] shrink-0 cursor-pointer"
              >
                {copiedGitignore ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied Rules</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Suggested Rules</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!gitignoreAnalysis || gitignoreAnalysis.sensitiveFilesFound.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#8B949E]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>No sensitive filename candidates (.env, *.pem, credentials.json) were detected in selected paths.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gitignoreAnalysis.sensitiveFilesFound.map((item) => (
                <div
                  key={item.filePath}
                  className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-slate-100 dark:border-[#1D232C] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-slate-800 dark:text-[#E6EDF3] truncate">
                      {item.filePath}
                    </p>
                    <p className="text-slate-500 dark:text-[#8B949E]">{item.reason}</p>
                  </div>
                  {item.covered ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] shrink-0">
                      Ignored ({item.matchedRule})
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300 font-mono text-[11px] shrink-0">
                      Not ignored
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-[#8B949E] border-t border-slate-200 dark:border-[#222933] pt-2.5">
            Scope note: Inspects selected file paths and local <code className="font-mono">.gitignore</code> contents only. It does not check whether files are tracked, staged, or present in Git history.
          </p>
        </div>
      </section>

      {/* Skipped Files Review */}
      {skippedFiles.length > 0 && (
        <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5">
          <button
            type="button"
            onClick={() => setShowSkipped((v) => !v)}
            className="flex items-center justify-between w-full text-left cursor-pointer"
          >
            <span className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              Skipped &amp; Excluded Files ({skippedFiles.length.toLocaleString()})
            </span>
            {showSkipped ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showSkipped && (
            <div className="mt-4 max-h-64 overflow-y-auto rounded border border-slate-200 dark:border-[#222933]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Path</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium">Skip Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#222933]">
                  {skippedFiles.slice(0, 300).map((f, idx) => (
                    <tr key={`${f.path}-${idx}`}>
                      <td className="px-3 py-1.5 font-mono text-slate-800 dark:text-[#E6EDF3] break-all">
                        {f.path}
                      </td>
                      <td className="px-3 py-1.5 font-mono tabular-nums text-slate-500 dark:text-[#8B949E] whitespace-nowrap">
                        {formatBytes(f.size)}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600 dark:text-[#8B949E]">
                        {f.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Honest Detection Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-slate-200 dark:border-[#222933] bg-slate-50 dark:bg-[#11151B] text-xs text-slate-600 dark:text-[#8B949E]">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Pattern-based and entropy-based secret detection can produce false positives and false negatives. Findings identify potential exposures locally and do not attempt to authenticate or validate credentials against external services.
        </p>
      </div>
    </div>
  );
};
