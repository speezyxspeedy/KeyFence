import React from 'react';
import {
  ArrowRight,
  FileArchive,
  FolderOpen,
  History,
  Play,
  RotateCcw,
  Shield,
  Sliders,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { PrivacyBanner } from '../common/PrivacyNotice.tsx';
import { DemoMarker } from '../common/SeverityBadge.tsx';

export const OverviewView: React.FC = () => {
  const {
    setActiveTab,
    currentSummary,
    findings,
    rules,
    history,
    loadAndRunDemoProject,
    resetDemoProject,
    isScanning,
    gitignoreAnalysis,
  } = useScanner();

  const enabledRulesCount = rules.filter((r) => r.enabled).length;
  const openFindingsCount = findings.filter((f) => f.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Hero Workspace Banner */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
              <Shield className="w-4 h-4 shrink-0" />
              <span>KeyFence · Local Code &amp; Secret Inspector</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-[#E6EDF3]">
              Find exposed secrets before they reach your repository.
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#8B949E] leading-relaxed">
              Inspect folders, ZIP archives, or individual source files directly inside your browser. KeyFence detects potential credentials, evaluates contextual confidence, masks matched values, and audits local <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-[#161B22]">.gitignore</code> coverage without transmitting code anywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('new-scan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start Local Scan</span>
            </button>
            <button
              type="button"
              onClick={loadAndRunDemoProject}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] hover:bg-slate-100 dark:hover:bg-[#1C222B] text-slate-800 dark:text-[#E6EDF3] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <span>LOAD DEMO PROJECT</span>
            </button>
            {currentSummary?.isDemo && (
              <button
                type="button"
                onClick={resetDemoProject}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-xs font-medium text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#222933] whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET DEMO</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <PrivacyBanner />

      {/* Current Scan Snapshot OR How-it-works Grid */}
      {currentSummary ? (
        <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  Active Scan: {currentSummary.projectLabel}
                </h2>
                {currentSummary.isDemo && <DemoMarker />}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-1 font-mono tabular-nums">
                {currentSummary.scanId} · Completed {new Date(currentSummary.completedAt).toLocaleString()} · {currentSummary.durationMs} ms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('scan-results')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] hover:bg-slate-50 dark:hover:bg-[#161B22] text-slate-700 dark:text-[#E6EDF3] whitespace-nowrap cursor-pointer"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('findings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20 whitespace-nowrap cursor-pointer"
              >
                <span>Inspect Findings ({openFindingsCount} Open)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-[#222933]">
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Files Scanned</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-[#E6EDF3] mt-1">
                {currentSummary.filesScanned}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Total Findings</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-[#E6EDF3] mt-1">
                {currentSummary.totalFindings}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Critical / High</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-red-600 dark:text-red-400 mt-1">
                {currentSummary.severityCounts.CRITICAL} / {currentSummary.severityCounts.HIGH}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Uncovered Sensitive Files</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300 mt-1">
                {gitignoreAnalysis ? gitignoreAnalysis.uncoveredCount : 0}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('new-scan')}
            className="text-left rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] hover:border-emerald-500/50 p-5 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              1. Select Project Folder or Files
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1.5 leading-relaxed">
              Choose a local directory with relative paths preserved, or pick individual configuration and source files. Binary and build folders are automatically skipped.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new-scan')}
            className="text-left rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] hover:border-emerald-500/50 p-5 transition-colors cursor-pointer"
          >
            <FileArchive className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              2. Extract ZIP Archives Locally
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1.5 leading-relaxed">
              Decompress project archives inside browser memory using JSZip with path-traversal protection and archive expansion size caps.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className="text-left rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] hover:border-emerald-500/50 p-5 transition-colors cursor-pointer"
          >
            <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              3. Pattern + Entropy Detection
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1.5 leading-relaxed">
              {enabledRulesCount} active rules scan for cloud keys, database URIs, private keys, and high-entropy tokens with masked previews and remediation steps.
            </p>
          </button>
        </section>
      )}

      {/* Workspace Summary Row: Rules & Local History */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
                Detection Engine Status
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1">
                {enabledRulesCount} of {rules.length} rules enabled across 8 security categories. Heuristic entropy matches are separated from strong signature patterns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Configure Rules
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8B949E] border-t border-slate-200 dark:border-[#222933] pt-3">
            Note: Pattern-based detection can produce false positives and false negatives. It does not validate whether a credential is active.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3] flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Browser-Local Scan History</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1">
                {history.length === 0
                  ? 'No scans recorded yet in this browser.'
                  : `${history.length} scan metadata record(s) stored locally. Raw secrets are never saved.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open History
            </button>
          </div>

          {history.length > 0 && (
            <div className="border-t border-slate-200 dark:border-[#222933] pt-3 space-y-1.5">
              {history.slice(0, 2).map((entry) => (
                <div
                  key={entry.scanId}
                  className="flex items-center justify-between text-xs text-slate-600 dark:text-[#8B949E]"
                >
                  <span className="truncate font-medium text-slate-800 dark:text-[#E6EDF3]">
                    {entry.projectLabel}
                  </span>
                  <span className="font-mono tabular-nums shrink-0 ml-2">
                    {entry.filesScanned} files · {entry.findingsCount} findings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
