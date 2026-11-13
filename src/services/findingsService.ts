import {
  AffectedFileItem,
  CategoryBreakdownItem,
  Confidence,
  Finding,
  FindingFilters,
  RuleCategory,
  Severity,
} from '../types/index.ts';

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export function filterAndSortFindings(
  findings: Finding[],
  filters: FindingFilters
): Finding[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = findings.filter((f) => {
    if (filters.severity !== 'ALL' && f.severity !== filters.severity) return false;
    if (filters.category !== 'ALL' && f.category !== filters.category) return false;
    if (filters.confidence !== 'ALL' && f.confidence !== filters.confidence) return false;
    if (filters.extension !== 'ALL' && f.fileExtension !== filters.extension) return false;
    if (filters.status !== 'ALL' && f.status !== filters.status) return false;

    if (query) {
      const hay = `${f.filePath} ${f.ruleName} ${f.ruleId} ${f.category} ${f.id}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'severity': {
        const diff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
        if (diff !== 0) return diff;
        return b.confidenceScore - a.confidenceScore;
      }
      case 'confidence': {
        const diff = CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence];
        if (diff !== 0) return diff;
        return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      }
      case 'filename': {
        const cmp = a.filePath.localeCompare(b.filePath);
        if (cmp !== 0) return cmp;
        return a.lineNumber - b.lineNumber;
      }
      case 'line': {
        const cmp = a.lineNumber - b.lineNumber;
        if (cmp !== 0) return cmp;
        return a.filePath.localeCompare(b.filePath);
      }
      default:
        return 0;
    }
  });
}

export function getCategoryBreakdown(findings: Finding[]): CategoryBreakdownItem[] {
  const counts = new Map<RuleCategory, number>();
  for (const f of findings) {
    counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getMostAffectedFiles(
  findings: Finding[],
  limit = 6
): AffectedFileItem[] {
  const map = new Map<string, { count: number; highestSeverity: Severity }>();
  for (const f of findings) {
    const prev = map.get(f.filePath);
    if (!prev) {
      map.set(f.filePath, { count: 1, highestSeverity: f.severity });
    } else {
      const highest =
        SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[prev.highestSeverity]
          ? f.severity
          : prev.highestSeverity;
      map.set(f.filePath, { count: prev.count + 1, highestSeverity: highest });
    }
  }

  return Array.from(map.entries())
    .map(([filePath, info]) => ({
      filePath,
      count: info.count,
      highestSeverity: info.highestSeverity,
    }))
    .sort((a, b) => b.count - a.count || SEVERITY_ORDER[b.highestSeverity] - SEVERITY_ORDER[a.highestSeverity])
    .slice(0, limit);
}

export function getUniqueExtensions(findings: Finding[]): string[] {
  return Array.from(new Set(findings.map((f) => f.fileExtension))).sort();
}
