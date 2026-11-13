import React, { useMemo } from 'react';
import { FilterX, Search, ShieldCheck } from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import {
  filterAndSortFindings,
  getUniqueExtensions,
} from '../../services/findingsService.ts';
import {
  Confidence,
  FindingStatus,
  RuleCategory,
  Severity,
} from '../../types/index.ts';
import {
  ConfidenceLabel,
  DemoMarker,
  SeverityTag,
  StatusLabel,
} from '../common/SeverityBadge.tsx';
import { CodeContextViewer } from '../code-viewer/CodeContextViewer.tsx';

const SEVERITIES: Array<Severity | 'ALL'> = [
  'ALL',
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
];

const CATEGORIES: Array<RuleCategory | 'ALL'> = [
  'ALL',
  'Cloud Credentials',
  'API Authentication',
  'Database Credentials',
  'Private Key Exposure',
  'Generic Password Assignment',
  'Webhook Credentials',
  'Configuration Secrets',
  'High Entropy Values',
];

const CONFIDENCES: Array<Confidence | 'ALL'> = ['ALL', 'High', 'Medium', 'Low'];

const STATUSES: Array<FindingStatus | 'ALL'> = [
  'ALL',
  'OPEN',
  'REVIEWED',
  'FALSE POSITIVE',
  'ACCEPTED RISK',
  'RESOLVED',
];

export const FindingsExplorerView: React.FC = () => {
  const {
    currentSummary,
    findings,
    filters,
    setFilters,
    resetFilters,
    selectedFindingId,
    setSelectedFindingId,
    updateFindingStatus,
    setActiveTab,
    loadAndRunDemoProject,
  } = useScanner();

  const extensions = useMemo(() => getUniqueExtensions(findings), [findings]);

  const filteredFindings = useMemo(
    () => filterAndSortFindings(findings, filters),
    [findings, filters]
  );

  const selectedFinding = useMemo(
    () =>
      filteredFindings.find((f) => f.id === selectedFindingId) ||
      findings.find((f) => f.id === selectedFindingId) ||
      null,
    [filteredFindings, findings, selectedFindingId]
  );

  if (!currentSummary) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-10 text-center space-y-4">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Findings Explorer
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8B949E]">
            Run a security scan or load the Demo Project to filter, triage, and inspect detected potential secrets.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
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
            className="px-4 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-[#30363D] text-slate-800 dark:text-[#E6EDF3] cursor-pointer"
          >
            LOAD DEMO PROJECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
              Findings Explorer
            </h1>
            {currentSummary.isDemo && <DemoMarker />}
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-[#8B949E] mt-1 tabular-nums">
            Showing {filteredFindings.length} of {findings.length} finding(s) · {currentSummary.projectLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] self-start sm:self-auto cursor-pointer"
        >
          <FilterX className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Filter by file, rule, category, or finding ID..."
            aria-label="Filter findings"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3] focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          aria-label="Filter by severity"
          value={filters.severity}
          onChange={(e) =>
            setFilters((p) => ({ ...p, severity: e.target.value as Severity | 'ALL' }))
          }
          className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Severities' : s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              category: e.target.value as RuleCategory | 'ALL',
            }))
          }
          className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All Categories' : c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by confidence"
          value={filters.confidence}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              confidence: e.target.value as Confidence | 'ALL',
            }))
          }
          className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
        >
          {CONFIDENCES.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All Confidence' : `${c} Confidence`}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                status: e.target.value as FindingStatus | 'ALL',
              }))
            }
            className="w-1/2 px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort findings"
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                sortBy: e.target.value as 'severity' | 'confidence' | 'filename' | 'line',
              }))
            }
            className="w-1/2 px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
          >
            <option value="severity">Sort: Severity</option>
            <option value="confidence">Sort: Confidence</option>
            <option value="filename">Sort: Filename</option>
            <option value="line">Sort: Line #</option>
          </select>
        </div>

        {extensions.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-[#1D232C]">
            <span className="text-[11px] text-slate-500 dark:text-[#8B949E] mr-1">
              Extension:
            </span>
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, extension: 'ALL' }))}
              className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                filters.extension === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-[#8B949E] hover:bg-slate-100 dark:hover:bg-[#161B22]'
              }`}
            >
              All
            </button>
            {extensions.map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => setFilters((p) => ({ ...p, extension: ext }))}
                className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                  filters.extension === ext
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-[#8B949E] hover:bg-slate-100 dark:hover:bg-[#161B22]'
                }`}
              >
                {ext}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Findings Table + Detail Split */}
      <div
        className={`grid gap-4 ${
          selectedFinding ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        <div
          className={`${
            selectedFinding ? 'xl:col-span-7' : ''
          } rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] overflow-hidden`}
        >
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-[#8B949E]">
              {findings.length === 0
                ? 'No potential secrets detected by the active rules.'
                : 'No findings match the current filter criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E] border-b border-slate-200 dark:border-[#222933]">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Severity</th>
                    <th className="px-3 py-2.5 font-medium">Rule</th>
                    <th className="px-3 py-2.5 font-medium">File</th>
                    <th className="px-3 py-2.5 font-medium text-right">Line</th>
                    <th className="px-3 py-2.5 font-medium">Confidence</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#222933]">
                  {filteredFindings.map((finding) => {
                    const isSelected = finding.id === selectedFinding?.id;
                    return (
                      <tr
                        key={finding.id}
                        onClick={() => setSelectedFindingId(finding.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/8 dark:bg-emerald-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-[#161B22]'
                        }`}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <SeverityTag severity={finding.severity} />
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <div className="font-medium text-slate-900 dark:text-[#E6EDF3] truncate">
                            {finding.ruleName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#8B949E] truncate">
                            {finding.category}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-[#E6EDF3] max-w-[220px] truncate">
                          {finding.filePath}
                        </td>
                        <td className="px-3 py-2.5 font-mono tabular-nums text-right text-slate-600 dark:text-[#8B949E]">
                          {finding.lineNumber}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <ConfidenceLabel confidence={finding.confidence} />
                        </td>
                        <td
                          className="px-3 py-2.5 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            aria-label={`Status for ${finding.id}`}
                            value={finding.status}
                            onChange={(e) =>
                              updateFindingStatus(
                                finding.id,
                                e.target.value as FindingStatus
                              )
                            }
                            className="text-[11px] font-mono rounded border border-slate-200 dark:border-[#30363D] bg-white dark:bg-[#0B0D10] px-1.5 py-1 text-slate-800 dark:text-[#E6EDF3]"
                          >
                            {STATUSES.filter((s) => s !== 'ALL').map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFindingId(finding.id);
                            }}
                            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Inspect
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

        {selectedFinding && (
          <div className="xl:col-span-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)]">
            <CodeContextViewer
              finding={selectedFinding}
              onClose={() => setSelectedFindingId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
