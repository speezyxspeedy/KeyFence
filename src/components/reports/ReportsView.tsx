import React from 'react';
import {
  AlertTriangle,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import {
  generateCsvReport,
  generateJsonReport,
  generatePrintableHtmlReport,
  REPORT_DISCLAIMER,
  triggerFileDownload,
} from '../../services/reportService.ts';
import { DemoMarker, SeverityTag } from '../common/SeverityBadge.tsx';

export const ReportsView: React.FC = () => {
  const { currentSummary, findings, setActiveTab, loadAndRunDemoProject } =
    useScanner();

  if (!currentSummary) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-10 text-center space-y-4">
        <FileText className="w-8 h-8 mx-auto text-slate-400" />
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Security Reports
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8B949E]">
            Complete a local scan or run the Demo Project to export masked JSON, CSV, or printable HTML security reports.
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

  const baseName = `keyfence-report-${currentSummary.scanId.toLowerCase()}`;

  const handleExportJson = () => {
    const json = generateJsonReport(currentSummary, findings);
    triggerFileDownload(json, `${baseName}.json`, 'application/json');
  };

  const handleExportCsv = () => {
    const csv = generateCsvReport(currentSummary, findings);
    triggerFileDownload(csv, `${baseName}.csv`, 'text/csv;charset=utf-8');
  };

  const handleExportHtml = () => {
    const html = generatePrintableHtmlReport(currentSummary, findings);
    triggerFileDownload(html, `${baseName}.html`, 'text/html;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
              Security Reports
            </h1>
            {currentSummary.isDemo && <DemoMarker />}
          </div>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Export sanitized findings reports. Raw credential values and unmasked source code are never included.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-slate-800 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#1C222B] self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Current View</span>
        </button>
      </div>

      {/* Export Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              JSON Security Report
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1">
              Structured summary, category counts, file locations, masked previews, triage statuses, and remediation guidance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FileSpreadsheet className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              CSV Findings Export
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1">
              Spreadsheet-ready export with formula-injection sanitization (<code className="font-mono">= + - @</code>) and masked values only.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-md text-xs font-semibold border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] hover:bg-slate-100 dark:hover:bg-[#1C222B] text-slate-900 dark:text-[#E6EDF3] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              Printable HTML Report
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1">
              Self-contained escaped HTML report formatted for archiving or printing to PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportHtml}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-md text-xs font-semibold border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] hover:bg-slate-100 dark:hover:bg-[#1C222B] text-slate-900 dark:text-[#E6EDF3] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </button>
        </div>
      </section>

      {/* Report Preview */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-[#222933]">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
              KeyFence Report Preview — {currentSummary.projectLabel}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-[#8B949E] mt-0.5">
              {currentSummary.scanId} · {new Date(currentSummary.completedAt).toLocaleString()} · {currentSummary.filesScanned} scanned / {currentSummary.filesSkipped} skipped
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Masked Values Only</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E]">
              <tr>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Rule ID &amp; Name</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Masked Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#222933]">
              {findings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-500 dark:text-[#8B949E]"
                  >
                    No potential secrets detected.
                  </td>
                </tr>
              ) : (
                findings.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2">
                      <SeverityTag severity={f.severity} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-slate-500 dark:text-[#8B949E] mr-1.5">
                        {f.ruleId}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-[#E6EDF3]">
                        {f.ruleName}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-[#E6EDF3]">
                      {f.filePath}:{f.lineNumber}
                    </td>
                    <td className="px-3 py-2">{f.confidence}</td>
                    <td className="px-3 py-2 font-mono">{f.status}</td>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-[#E6EDF3]">
                      {f.maskedValue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded border border-slate-200 dark:border-[#222933] bg-slate-50 dark:bg-[#0B0D10] text-xs text-slate-600 dark:text-[#8B949E]">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>{REPORT_DISCLAIMER}</p>
        </div>
      </section>
    </div>
  );
};
