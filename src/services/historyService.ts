import { ScanHistoryEntry, ScanSummary } from '../types/index.ts';

const HISTORY_STORAGE_KEY = 'keyfence_scan_history_v1';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Persists strictly metadata-only scan summaries to browser localStorage.
 * Never persists raw secrets, file contents, or code previews.
 */
export function loadScanHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ScanHistoryEntry =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.scanId === 'string' &&
        typeof item.projectLabel === 'string' &&
        typeof item.scanDate === 'string'
    );
  } catch {
    return [];
  }
}

export function saveScanToHistory(summary: ScanSummary): ScanHistoryEntry[] {
  const entry: ScanHistoryEntry = {
    scanId: summary.scanId,
    projectLabel: summary.projectLabel,
    scanDate: summary.completedAt,
    filesScanned: summary.filesScanned,
    filesSkipped: summary.filesSkipped,
    totalFiles: summary.totalFilesSelected,
    findingsCount: summary.totalFindings,
    severitySummary: { ...summary.severityCounts },
    durationMs: summary.durationMs,
    isDemo: summary.isDemo,
  };

  const existing = loadScanHistory().filter((e) => e.scanId !== entry.scanId);
  const next = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors cleanly
  }

  return next;
}

export function deleteHistoryEntry(scanId: string): ScanHistoryEntry[] {
  const next = loadScanHistory().filter((e) => e.scanId !== scanId);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

export function clearAllScanHistory(): ScanHistoryEntry[] {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore
  }
  return [];
}
