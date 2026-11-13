import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_DETECTION_RULES } from '../services/detectionRules.ts';
import { DEFAULT_IGNORE_CONFIG } from '../services/fileService.ts';
import { getDemoProjectFiles } from '../services/demoProjectService.ts';
import { runProjectScan, scanSingleTextContent } from '../services/scannerEngine.ts';
import { saveScanToHistory } from '../services/historyService.ts';

const SETTINGS = {
  theme: 'dark' as const,
  useWebWorker: false,
  entropyMinLength: 20,
  entropyThreshold: 3.8,
  enableEntropyHeuristic: true,
  contextLinesRadius: 3,
};

describe('Scanner Engine, Deduplication, Cancellation & Privacy', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    });
  });

  it('runs the fictional demo project through the real scanner without external network calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const demoFiles = getDemoProjectFiles();
    const res = await runProjectScan({
      projectLabel: 'KeyFence Demo',
      inputs: demoFiles,
      rules: BUILTIN_DETECTION_RULES,
      ignoreConfig: DEFAULT_IGNORE_CONFIG,
      settings: SETTINGS,
      isDemo: true,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.summary.isDemo).toBe(true);
    expect(res.summary.filesScanned).toBe(demoFiles.length);
    expect(res.findings.length).toBeGreaterThanOrEqual(5);
    expect(res.findings.every((f) => f.isDemo === true)).toBe(true);

    // Ensure no finding preview or maskedValue exposes the raw demo placeholder secret
    for (const f of res.findings) {
      expect(f.maskedValue).not.toContain('DEMO9876543210PLACEHOLDER0011');
      expect(f.maskedPreview).not.toContain('DEMO9876543210PLACEHOLDER0011');
    }

    // Ensure history persists metadata only and zero raw secrets
    const history = saveScanToHistory(res.summary);
    const serialized = JSON.stringify(history);
    expect(serialized).not.toContain('DEMO9876543210PLACEHOLDER0011');
    expect(serialized).not.toContain('Demo_Placeholder_Pw99');
  });

  it('suppresses overlapping duplicate findings on the same line', () => {
    const line = 'const stripeKey = "sk-live-1234567890abcdefghij99";';
    const { findings } = scanSingleTextContent({
      scanId: 'SCAN-DUP',
      filePath: 'src/billing.ts',
      content: line,
      rules: BUILTIN_DETECTION_RULES,
      settings: SETTINGS,
      isDemo: false,
      detectedAt: '2026-11-13T00:00:00.000Z',
    });

    // Both generic apiKey and specific sk- prefix match the same span; deduplication keeps 1 highest-ranked finding
    expect(findings.length).toBe(1);
  });

  it('supports scan cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runProjectScan({
        projectLabel: 'Cancelled Scan',
        inputs: getDemoProjectFiles(),
        rules: BUILTIN_DETECTION_RULES,
        ignoreConfig: DEFAULT_IGNORE_CONFIG,
        settings: SETTINGS,
        signal: controller.signal,
      })
    ).rejects.toThrow(/cancelled/i);
  });
});
