import { scanSingleTextContent } from '../services/scannerEngine.ts';
import { AppSettings, DetectionRule, Finding } from '../types/index.ts';

interface WorkerStartMessage {
  type: 'START';
  payload: {
    scanId: string;
    files: Array<{ path: string; size: number; content: string }>;
    rules: DetectionRule[];
    settings: AppSettings;
    isDemo: boolean;
    detectedAt: string;
  };
}

interface WorkerCancelMessage {
  type: 'CANCEL';
}

type WorkerInMessage = WorkerStartMessage | WorkerCancelMessage;

let cancelled = false;

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'CANCEL') {
    cancelled = true;
    return;
  }

  if (data.type === 'START') {
    cancelled = false;
    const { scanId, files, rules, settings, isDemo, detectedAt } = data.payload;

    try {
      const allFindings: Finding[] = [];
      const allRawValues: Array<{ id: string; value: string }> = [];

      for (let i = 0; i < files.length; i++) {
        if (cancelled) {
          return;
        }

        const file = files[i];
        const res = scanSingleTextContent({
          scanId,
          filePath: file.path,
          content: file.content,
          rules,
          settings,
          isDemo,
          detectedAt,
        });

        allFindings.push(...res.findings);
        allRawValues.push(...res.rawValues);

        if (i % 5 === 0 || i === files.length - 1) {
          self.postMessage({
            type: 'PROGRESS',
            processed: i + 1,
            currentFile: file.path,
            findingsCount: allFindings.length,
          });
        }
      }

      self.postMessage({
        type: 'COMPLETE',
        findings: allFindings,
        rawValues: allRawValues,
      });
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        error: err instanceof Error ? err.message : 'Worker scan failed',
      });
    }
  }
};
