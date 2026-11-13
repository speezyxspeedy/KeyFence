import { Finding, ScanSummary } from '../types/index.ts';
import { getCategoryBreakdown } from './findingsService.ts';

export const REPORT_DISCLAIMER =
  'Results are based on local pattern-based analysis. Findings may include false positives and false negatives. This report is not a certification of repository security.';

/**
 * Sanitizes CSV cell values against spreadsheet formula injection (=, +, -, @, tab, CR).
 */
export function sanitizeCsvCell(value: string | number | boolean | undefined | null): string {
  const raw = value === undefined || value === null ? '' : String(value);
  let safe = raw;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateJsonReport(summary: ScanSummary, findings: Finding[]): string {
  const categories = getCategoryBreakdown(findings);

  const sanitizedFindings = findings.map((f) => ({
    id: f.id,
    ruleId: f.ruleId,
    ruleName: f.ruleName,
    category: f.category,
    severity: f.severity,
    confidence: f.confidence,
    filePath: f.filePath,
    lineNumber: f.lineNumber,
    columnNumber: f.columnNumber,
    maskedValue: f.maskedValue,
    maskedPreview: f.maskedPreview,
    status: f.status,
    remediation: f.remediation,
    detectedAt: f.detectedAt,
    isHeuristicOnly: Boolean(f.isHeuristicOnly),
    isDemo: Boolean(f.isDemo),
  }));

  const payload = {
    tool: 'KeyFence',
    tagline: 'Find It. Fix It. Secure It.',
    reportGeneratedAt: new Date().toISOString(),
    disclaimer: REPORT_DISCLAIMER,
    summary: {
      scanId: summary.scanId,
      projectLabel: summary.projectLabel,
      startedAt: summary.startedAt,
      completedAt: summary.completedAt,
      durationMs: summary.durationMs,
      filesScanned: summary.filesScanned,
      filesSkipped: summary.filesSkipped,
      totalFindings: summary.totalFindings,
      severityDistribution: summary.severityCounts,
      categories,
      isDemo: summary.isDemo,
    },
    findings: sanitizedFindings,
  };

  return JSON.stringify(payload, null, 2);
}

export function generateCsvReport(summary: ScanSummary, findings: Finding[]): string {
  const headers = [
    'Scan ID',
    'Project',
    'Finding ID',
    'Severity',
    'Confidence',
    'Status',
    'Rule ID',
    'Rule Name',
    'Category',
    'File Path',
    'Line Number',
    'Masked Value',
    'Recommended Remediation',
  ];

  const rows: string[] = [headers.map((h) => sanitizeCsvCell(h)).join(',')];

  for (const f of findings) {
    rows.push(
      [
        summary.scanId,
        summary.projectLabel,
        f.id,
        f.severity,
        f.confidence,
        f.status,
        f.ruleId,
        f.ruleName,
        f.category,
        f.filePath,
        f.lineNumber,
        f.maskedValue,
        f.remediation.join(' | '),
      ]
        .map((cell) => sanitizeCsvCell(cell))
        .join(',')
    );
  }

  // Append disclaimer row at end
  rows.push('');
  rows.push(sanitizeCsvCell(`Note: ${REPORT_DISCLAIMER}`));

  return rows.join('\r\n');
}

export function generatePrintableHtmlReport(
  summary: ScanSummary,
  findings: Finding[]
): string {
  const categories = getCategoryBreakdown(findings);

  const findingRows = findings
    .map(
      (f) => `
      <tr>
        <td><span class="sev sev-${escapeHtmlText(f.severity.toLowerCase())}">${escapeHtmlText(f.severity)}</span></td>
        <td><code>${escapeHtmlText(f.ruleId)}</code><br/><strong>${escapeHtmlText(f.ruleName)}</strong><br/><span class="muted">${escapeHtmlText(f.category)}</span></td>
        <td><code>${escapeHtmlText(f.filePath)}:${f.lineNumber}</code></td>
        <td>${escapeHtmlText(f.confidence)}</td>
        <td>${escapeHtmlText(f.status)}</td>
        <td><code>${escapeHtmlText(f.maskedValue)}</code></td>
        <td>${escapeHtmlText(f.remediation[0] ?? '')}</td>
      </tr>`
    )
    .join('\n');

  const categoryRows = categories
    .map(
      (c) =>
        `<li><strong>${escapeHtmlText(c.category)}:</strong> ${c.count}</li>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KeyFence Security Report — ${escapeHtmlText(summary.projectLabel)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
    header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; font-size: 22px; }
    .sub { color: #475569; font-size: 13px; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
    .box .label { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    .box .val { font-size: 22px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; word-break: break-all; }
    .muted { color: #64748b; font-size: 11px; }
    .sev { display: inline-block; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
    .sev-critical { background: #fee2e2; color: #991b1b; }
    .sev-high { background: #ffedd5; color: #9a3412; }
    .sev-medium { background: #fef3c7; color: #92400e; }
    .sev-low { background: #e0f2fe; color: #075985; }
    .sev-info { background: #f1f5f9; color: #334155; }
    .disclaimer { margin-top: 24px; padding: 12px 16px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 12px; color: #334155; border-radius: 6px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>KeyFence Security Scan Report</h1>
      <div class="sub">Project: <strong>${escapeHtmlText(summary.projectLabel)}</strong> · Scan ID: ${escapeHtmlText(summary.scanId)} · ${escapeHtmlText(new Date(summary.completedAt).toLocaleString())}${summary.isDemo ? ' · DEMO PROJECT' : ''}</div>
    </div>
    <div class="sub">Local Browser Analysis · Masked Secret Output Only</div>
  </header>

  <section class="grid">
    <div class="box"><div class="label">Files Scanned</div><div class="val">${summary.filesScanned}</div></div>
    <div class="box"><div class="label">Files Skipped</div><div class="val">${summary.filesSkipped}</div></div>
    <div class="box"><div class="label">Total Findings</div><div class="val">${summary.totalFindings}</div></div>
    <div class="box"><div class="label">Critical / High</div><div class="val">${summary.severityCounts.CRITICAL} / ${summary.severityCounts.HIGH}</div></div>
  </section>

  <section>
    <h2>Categories Detected</h2>
    <ul>${categoryRows || '<li>No findings recorded.</li>'}</ul>
  </section>

  <section>
    <h2>Findings Detail</h2>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Rule &amp; Category</th>
          <th>Location</th>
          <th>Confidence</th>
          <th>Status</th>
          <th>Masked Match</th>
          <th>Primary Remediation</th>
        </tr>
      </thead>
      <tbody>
        ${findingRows || '<tr><td colspan="7">No potential secrets detected by enabled rules.</td></tr>'}
      </tbody>
    </table>
  </section>

  <div class="disclaimer">
    <strong>Methodology &amp; Limitations:</strong> ${escapeHtmlText(REPORT_DISCLAIMER)}
  </div>
</body>
</html>`;
}

export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
