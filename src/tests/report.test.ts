import { describe, expect, it } from 'vitest';
import { filterAndSortFindings } from '../services/findingsService.ts';
import {
  escapeHtmlText,
  generateCsvReport,
  generateJsonReport,
  generatePrintableHtmlReport,
  REPORT_DISCLAIMER,
  sanitizeCsvCell,
} from '../services/reportService.ts';
import { Finding, ScanSummary } from '../types/index.ts';

const MOCK_SUMMARY: ScanSummary = {
  scanId: 'SCAN-RPT1',
  projectLabel: 'TestProject',
  startedAt: '2026-11-13T09:00:00.000Z',
  completedAt: '2026-11-13T09:00:01.000Z',
  durationMs: 120,
  totalFilesSelected: 3,
  filesScanned: 3,
  filesSkipped: 0,
  totalBytesSelected: 512,
  totalBytesScanned: 512,
  rulesExecuted: 25,
  totalFindings: 2,
  severityCounts: { CRITICAL: 1, HIGH: 0, MEDIUM: 1, LOW: 0, INFO: 0 },
  isDemo: false,
};

const MOCK_FINDINGS: Finding[] = [
  {
    id: 'KF-1',
    scanId: 'SCAN-RPT1',
    ruleId: 'KF-API-001',
    ruleName: 'GitHub Personal Access Token',
    category: 'API Authentication',
    filePath: 'src/=evilFormula.ts',
    fileExtension: '.ts',
    lineNumber: 12,
    columnNumber: 5,
    matchLength: 30,
    severity: 'CRITICAL',
    confidence: 'High',
    confidenceScore: 92,
    explanation: 'Detected GitHub token pattern',
    maskedPreview: 'const tok = "ghp_****...****99";',
    maskedValue: 'ghp_****...****99',
    contextLines: [{ lineNumber: 12, maskedContent: 'const tok = "ghp_****...****99";', isMatchLine: true }],
    remediation: ['Rotate token'],
    status: 'OPEN',
    detectedAt: '2026-11-13T09:00:01.000Z',
  },
  {
    id: 'KF-2',
    scanId: 'SCAN-RPT1',
    ruleId: 'KF-PWD-001',
    ruleName: '<script>alert(1)</script> Rule',
    category: 'Generic Password Assignment',
    filePath: 'config/dev.env',
    fileExtension: '.env',
    lineNumber: 4,
    columnNumber: 1,
    matchLength: 14,
    severity: 'MEDIUM',
    confidence: 'Low',
    confidenceScore: 40,
    explanation: 'Detected password assignment',
    maskedPreview: 'password="****"',
    maskedValue: '****',
    contextLines: [{ lineNumber: 4, maskedContent: 'password="****"', isMatchLine: true }],
    remediation: ['Remove literal password'],
    status: 'RESOLVED',
    detectedAt: '2026-11-13T09:00:01.000Z',
  },
];

describe('Findings Filtering & Secure Report Generation', () => {
  it('filters by severity, confidence, and status accurately', () => {
    const critOnly = filterAndSortFindings(MOCK_FINDINGS, {
      search: '',
      severity: 'CRITICAL',
      category: 'ALL',
      confidence: 'ALL',
      extension: 'ALL',
      status: 'ALL',
      sortBy: 'severity',
    });
    expect(critOnly).toHaveLength(1);
    expect(critOnly[0].id).toBe('KF-1');

    const resolvedOnly = filterAndSortFindings(MOCK_FINDINGS, {
      search: '',
      severity: 'ALL',
      category: 'ALL',
      confidence: 'Low',
      extension: 'ALL',
      status: 'RESOLVED',
      sortBy: 'severity',
    });
    expect(resolvedOnly).toHaveLength(1);
    expect(resolvedOnly[0].id).toBe('KF-2');
  });

  it('sanitizes CSV cells against spreadsheet formula injection', () => {
    expect(sanitizeCsvCell('=CMD|"/C calc"!A0')).toBe('"\'=CMD|""/C calc""!A0"');
    expect(sanitizeCsvCell('+1+1')).toBe('"\'+1+1"');
    expect(sanitizeCsvCell('-2+3')).toBe('"\'-2+3"');
    expect(sanitizeCsvCell('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');

    const csv = generateCsvReport(MOCK_SUMMARY, MOCK_FINDINGS);
    expect(csv).toContain('ghp_****...****99');
    expect(csv).toContain(REPORT_DISCLAIMER);
  });

  it('generates valid JSON and safely escaped HTML reports without raw secrets', () => {
    const json = JSON.parse(generateJsonReport(MOCK_SUMMARY, MOCK_FINDINGS));
    expect(json.summary.totalFindings).toBe(2);
    expect(json.disclaimer).toBe(REPORT_DISCLAIMER);
    expect(json.findings[0].maskedValue).toBe('ghp_****...****99');

    const html = generatePrintableHtmlReport(MOCK_SUMMARY, MOCK_FINDINGS);
    expect(escapeHtmlText('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
