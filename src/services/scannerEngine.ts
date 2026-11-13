import {
  AppSettings,
  ContextLine,
  DetectionRule,
  Finding,
  IgnoreConfig,
  ProjectFileInput,
  ScanProgress,
  ScanSummary,
  Severity,
  SeverityCounts,
  SkippedFileInfo,
} from '../types/index.ts';
import { evaluateConfidence } from './confidenceEngine.ts';
import { findHighEntropyCandidates } from './entropyAnalyzer.ts';
import {
  classifyProjectFiles,
  getFileExtension,
  readProjectFileText,
} from './fileService.ts';
import {
  createMaskedPreview,
  maskLineWithSpan,
  maskSecretValue,
  sanitizeLineSecrets,
} from './redactionService.ts';

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

const MAX_LINE_SCAN_LENGTH = 8000;
const MAX_MATCHES_PER_LINE = 12;

export interface RawMatchRecord {
  findingId: string;
  rawValue: string;
}

export interface ScanExecutionResult {
  summary: ScanSummary;
  findings: Finding[];
  skippedFiles: SkippedFileInfo[];
  ephemeralRawValues: Map<string, string>;
  scannedFilePaths: string[];
  gitignoreContents: Array<{ path: string; content: string }>;
}

export interface TextFilePayload {
  path: string;
  size: number;
  content: string;
}

function emptySeverityCounts(): SeverityCounts {
  return { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
}

function buildContextLines(
  lines: string[],
  matchLineIdx: number,
  matchStart: number,
  matchEnd: number,
  rawSecret: string,
  radius: number
): ContextLine[] {
  const startIdx = Math.max(0, matchLineIdx - radius);
  const endIdx = Math.min(lines.length - 1, matchLineIdx + radius);
  const context: ContextLine[] = [];

  for (let i = startIdx; i <= endIdx; i++) {
    const lineContent = lines[i];
    const truncated =
      lineContent.length > 320 ? `${lineContent.slice(0, 320)} ...[truncated]` : lineContent;

    const maskedContent =
      i === matchLineIdx
        ? maskLineWithSpan(truncated, matchStart, matchEnd, rawSecret)
        : sanitizeLineSecrets(truncated);

    context.push({
      lineNumber: i + 1,
      maskedContent,
      isMatchLine: i === matchLineIdx,
    });
  }

  return context;
}

interface InternalCandidateFinding {
  finding: Finding;
  rawValue: string;
  spanStart: number;
  spanEnd: number;
}

export function scanSingleTextContent(params: {
  scanId: string;
  filePath: string;
  content: string;
  rules: DetectionRule[];
  settings: Pick<
    AppSettings,
    'enableEntropyHeuristic' | 'entropyMinLength' | 'entropyThreshold' | 'contextLinesRadius'
  >;
  isDemo: boolean;
  detectedAt: string;
}): { findings: Finding[]; rawValues: Array<{ id: string; value: string }> } {
  const { scanId, filePath, content, rules, settings, isDemo, detectedAt } = params;
  const lines = content.split(/\r?\n/);
  const ext = getFileExtension(filePath) || 'file';
  const enabledRules = rules.filter((r) => r.enabled);
  const entropyRule = enabledRules.find((r) => r.isHeuristic);
  const regexRules = enabledRules.filter((r) => !r.isHeuristic);

  const candidates: InternalCandidateFinding[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line || line.trim().length < 6) continue;
    if (line.length > MAX_LINE_SCAN_LENGTH) continue;

    // 1. Pattern-based rules
    for (const rule of regexRules) {
      let regex: RegExp;
      try {
        const flags = rule.flags?.includes('g') ? rule.flags : `${rule.flags ?? ''}g`;
        regex = new RegExp(rule.pattern, flags);
      } catch {
        continue;
      }

      let match: RegExpExecArray | null;
      let iterCount = 0;

      while ((match = regex.exec(line)) !== null && iterCount < MAX_MATCHES_PER_LINE) {
        iterCount++;
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }

        // Extract captured secret group (or fallback to first non-empty capture group, or full match)
        let secretValue = match[0];
        if (rule.captureGroup && match[rule.captureGroup]) {
          secretValue = match[rule.captureGroup];
        } else {
          for (let g = 1; g < match.length; g++) {
            if (match[g]) {
              secretValue = match[g];
              break;
            }
          }
        }

        const innerOffset = match[0].indexOf(secretValue);
        const spanStart = match.index + Math.max(0, innerOffset);
        const spanEnd = spanStart + secretValue.length;

        const evaluation = evaluateConfidence({
          rule,
          matchedValue: secretValue,
          line,
          filePath,
        });

        const findingId = `KF-${scanId.slice(-4)}-${candidates.length + 1}-${lineIdx + 1}`;
        const maskedValue = maskSecretValue(secretValue);
        const maskedPreview = createMaskedPreview(line, spanStart, spanEnd, secretValue);
        const contextLines = buildContextLines(
          lines,
          lineIdx,
          spanStart,
          spanEnd,
          secretValue,
          settings.contextLinesRadius
        );

        const reasonNotes =
          evaluation.notes.length > 0 ? ` (${evaluation.notes.join('; ')})` : '';

        candidates.push({
          rawValue: secretValue,
          spanStart,
          spanEnd,
          finding: {
            id: findingId,
            scanId,
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            filePath,
            fileExtension: ext,
            lineNumber: lineIdx + 1,
            columnNumber: spanStart + 1,
            matchLength: secretValue.length,
            severity: rule.severity,
            confidence: evaluation.confidence,
            confidenceScore: evaluation.score,
            explanation: `${rule.description}${reasonNotes}`,
            maskedPreview,
            maskedValue,
            contextLines,
            remediation: rule.remediation,
            status: 'OPEN',
            detectedAt,
            isHeuristicOnly: false,
            isDemo,
          },
        });
      }
    }

    // 2. High-entropy heuristic rule
    if (settings.enableEntropyHeuristic && entropyRule) {
      const entropyHits = findHighEntropyCandidates(
        line,
        settings.entropyMinLength,
        settings.entropyThreshold
      );

      for (const hit of entropyHits) {
        // Avoid adding heuristic hit if a concrete pattern already covers this exact span
        const overlapsPattern = candidates.some(
          (existing) =>
            existing.finding.lineNumber === lineIdx + 1 &&
            Math.max(existing.spanStart, hit.startIndex) <
              Math.min(existing.spanEnd, hit.endIndex)
        );
        if (overlapsPattern) continue;

        const evaluation = evaluateConfidence({
          rule: entropyRule,
          matchedValue: hit.value,
          line,
          filePath,
        });

        const findingId = `KF-${scanId.slice(-4)}-${candidates.length + 1}-${lineIdx + 1}`;
        const maskedValue = maskSecretValue(hit.value);
        const maskedPreview = createMaskedPreview(
          line,
          hit.startIndex,
          hit.endIndex,
          hit.value
        );
        const contextLines = buildContextLines(
          lines,
          lineIdx,
          hit.startIndex,
          hit.endIndex,
          hit.value,
          settings.contextLinesRadius
        );

        candidates.push({
          rawValue: hit.value,
          spanStart: hit.startIndex,
          spanEnd: hit.endIndex,
          finding: {
            id: findingId,
            scanId,
            ruleId: entropyRule.id,
            ruleName: entropyRule.name,
            category: entropyRule.category,
            filePath,
            fileExtension: ext,
            lineNumber: lineIdx + 1,
            columnNumber: hit.startIndex + 1,
            matchLength: hit.value.length,
            severity: hit.hasSecretContext ? 'MEDIUM' : 'LOW',
            confidence: evaluation.confidence,
            confidenceScore: evaluation.score,
            explanation: `Heuristic-only high-entropy string (Shannon entropy ${hit.entropy.toFixed(2)})${
              hit.hasSecretContext ? ' near secret-related identifier' : ''
            }.`,
            maskedPreview,
            maskedValue,
            contextLines,
            remediation: entropyRule.remediation,
            status: 'OPEN',
            detectedAt,
            isHeuristicOnly: true,
            isDemo,
          },
        });
      }
    }
  }

  // Deduplicate overlapping findings on the same line (prefer higher severity, then higher confidence score)
  const deduped: InternalCandidateFinding[] = [];
  for (const cand of candidates) {
    const overlapIdx = deduped.findIndex(
      (kept) =>
        kept.finding.lineNumber === cand.finding.lineNumber &&
        Math.max(kept.spanStart, cand.spanStart) < Math.min(kept.spanEnd, cand.spanEnd)
    );

    if (overlapIdx === -1) {
      deduped.push(cand);
    } else {
      const existing = deduped[overlapIdx];
      const existingRank =
        SEVERITY_RANK[existing.finding.severity] * 100 + existing.finding.confidenceScore;
      const candRank =
        SEVERITY_RANK[cand.finding.severity] * 100 + cand.finding.confidenceScore;

      if (candRank > existingRank) {
        deduped[overlapIdx] = cand;
      }
    }
  }

  // Re-index clean sequential IDs per file
  const findings: Finding[] = [];
  const rawValues: Array<{ id: string; value: string }> = [];

  deduped.forEach((item, idx) => {
    const id = `KF-${scanId.slice(-4)}-${filePath.split('/').pop()?.slice(0, 8).replace(/[^A-Za-z0-9]/g, '') || 'FILE'}-${item.finding.lineNumber}-${idx + 1}`;
    findings.push({ ...item.finding, id });
    rawValues.push({ id, value: item.rawValue });
  });

  return { findings, rawValues };
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function runProjectScan(params: {
  projectLabel: string;
  inputs: ProjectFileInput[];
  preSkipped?: SkippedFileInfo[];
  rules: DetectionRule[];
  ignoreConfig: IgnoreConfig;
  settings: AppSettings;
  isDemo?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ScanProgress) => void;
}): Promise<ScanExecutionResult> {
  const {
    projectLabel,
    inputs,
    preSkipped = [],
    rules,
    ignoreConfig,
    settings,
    isDemo = false,
    signal,
    onProgress,
  } = params;

  const startTime = performance.now();
  const startedAt = new Date().toISOString();
  const scanId = `SCAN-${Date.now().toString(36).toUpperCase()}`;

  onProgress?.({
    phase: 'filtering',
    totalFiles: inputs.length + preSkipped.length,
    processedFiles: 0,
    filesScanned: 0,
    filesSkipped: preSkipped.length,
    findingsCount: 0,
    currentFile: '',
    message: 'Applying exclusion rules and classifying files...',
  });

  const classified = classifyProjectFiles(inputs, ignoreConfig);
  const allSkipped: SkippedFileInfo[] = [...preSkipped, ...classified.skipped];
  const filesToRead = classified.supported;
  const totalSelectedCount = inputs.length + preSkipped.length;
  const totalSelectedBytes =
    classified.totalBytes + preSkipped.reduce((sum, s) => sum + s.size, 0);

  if (filesToRead.length === 0) {
    const completedAt = new Date().toISOString();
    return {
      summary: {
        scanId,
        projectLabel,
        startedAt,
        completedAt,
        durationMs: Math.max(1, Math.round(performance.now() - startTime)),
        totalFilesSelected: totalSelectedCount,
        filesScanned: 0,
        filesSkipped: allSkipped.length,
        totalBytesSelected: totalSelectedBytes,
        totalBytesScanned: 0,
        rulesExecuted: rules.filter((r) => r.enabled).length,
        totalFindings: 0,
        severityCounts: emptySeverityCounts(),
        isDemo,
      },
      findings: [],
      skippedFiles: allSkipped,
      ephemeralRawValues: new Map(),
      scannedFilePaths: [],
      gitignoreContents: [],
    };
  }

  // Read file text payloads locally in browser memory
  const textPayloads: TextFilePayload[] = [];
  const gitignoreContents: Array<{ path: string; content: string }> = [];
  const scannedFilePaths: string[] = [];
  let totalBytesScanned = 0;

  for (let i = 0; i < filesToRead.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    const fileInput = filesToRead[i];
    const readRes = await readProjectFileText(fileInput);
    if (!readRes.ok) {
      allSkipped.push({
        path: fileInput.path,
        size: fileInput.size,
        reason: readRes.reason,
      });
      continue;
    }

    totalBytesScanned += fileInput.size;
    scannedFilePaths.push(fileInput.path);

    if (fileInput.path.split('/').pop()?.toLowerCase() === '.gitignore') {
      gitignoreContents.push({ path: fileInput.path, content: readRes.text });
    }

    textPayloads.push({
      path: fileInput.path,
      size: fileInput.size,
      content: readRes.text,
    });

    if (i % 15 === 0) {
      onProgress?.({
        phase: 'scanning',
        totalFiles: filesToRead.length,
        processedFiles: i + 1,
        filesScanned: textPayloads.length,
        filesSkipped: allSkipped.length,
        findingsCount: 0,
        currentFile: fileInput.path,
        message: 'Reading selected project files locally...',
      });
      await yieldToMainThread();
    }
  }

  let findings: Finding[] = [];
  const ephemeralRawValues = new Map<string, string>();

  // Try Web Worker when enabled and supported
  const canUseWorker =
    settings.useWebWorker &&
    typeof Worker !== 'undefined' &&
    textPayloads.length > 0;

  if (canUseWorker) {
    try {
      const workerResult = await runScanInWorker({
        scanId,
        files: textPayloads,
        rules,
        settings,
        isDemo,
        detectedAt: startedAt,
        signal,
        onProgress: (processed, currentFile, findingsSoFar) => {
          onProgress?.({
            phase: 'scanning',
            totalFiles: textPayloads.length,
            processedFiles: processed,
            filesScanned: processed,
            filesSkipped: allSkipped.length,
            findingsCount: findingsSoFar,
            currentFile,
            message: `Analyzing ${currentFile || 'project files'}...`,
          });
        },
      });
      findings = workerResult.findings;
      for (const rv of workerResult.rawValues) {
        ephemeralRawValues.set(rv.id, rv.value);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      // Reliable main-thread fallback if worker instantiation fails
      const fallback = await runScanOnMainThread({
        scanId,
        files: textPayloads,
        rules,
        settings,
        isDemo,
        detectedAt: startedAt,
        signal,
        onProgress: (processed, currentFile, findingsSoFar) => {
          onProgress?.({
            phase: 'scanning',
            totalFiles: textPayloads.length,
            processedFiles: processed,
            filesScanned: processed,
            filesSkipped: allSkipped.length,
            findingsCount: findingsSoFar,
            currentFile,
            message: `Analyzing ${currentFile || 'project files'}...`,
          });
        },
      });
      findings = fallback.findings;
      for (const rv of fallback.rawValues) {
        ephemeralRawValues.set(rv.id, rv.value);
      }
    }
  } else {
    const mainResult = await runScanOnMainThread({
      scanId,
      files: textPayloads,
      rules,
      settings,
      isDemo,
      detectedAt: startedAt,
      signal,
      onProgress: (processed, currentFile, findingsSoFar) => {
        onProgress?.({
          phase: 'scanning',
          totalFiles: textPayloads.length,
          processedFiles: processed,
          filesScanned: processed,
          filesSkipped: allSkipped.length,
          findingsCount: findingsSoFar,
          currentFile,
          message: `Analyzing ${currentFile || 'project files'}...`,
        });
      },
    });
    findings = mainResult.findings;
    for (const rv of mainResult.rawValues) {
      ephemeralRawValues.set(rv.id, rv.value);
    }
  }

  const severityCounts = emptySeverityCounts();
  for (const f of findings) {
    severityCounts[f.severity]++;
  }

  const completedAt = new Date().toISOString();
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  onProgress?.({
    phase: 'complete',
    totalFiles: textPayloads.length,
    processedFiles: textPayloads.length,
    filesScanned: textPayloads.length,
    filesSkipped: allSkipped.length,
    findingsCount: findings.length,
    currentFile: '',
    message: 'Scan completed locally.',
  });

  return {
    summary: {
      scanId,
      projectLabel,
      startedAt,
      completedAt,
      durationMs,
      totalFilesSelected: totalSelectedCount,
      filesScanned: textPayloads.length,
      filesSkipped: allSkipped.length,
      totalBytesSelected: totalSelectedBytes,
      totalBytesScanned,
      rulesExecuted: rules.filter((r) => r.enabled).length,
      totalFindings: findings.length,
      severityCounts,
      isDemo,
    },
    findings,
    skippedFiles: allSkipped,
    ephemeralRawValues,
    scannedFilePaths,
    gitignoreContents,
  };
}

async function runScanOnMainThread(params: {
  scanId: string;
  files: TextFilePayload[];
  rules: DetectionRule[];
  settings: AppSettings;
  isDemo: boolean;
  detectedAt: string;
  signal?: AbortSignal;
  onProgress?: (processed: number, currentFile: string, findingsCount: number) => void;
}): Promise<{ findings: Finding[]; rawValues: Array<{ id: string; value: string }> }> {
  const findings: Finding[] = [];
  const rawValues: Array<{ id: string; value: string }> = [];

  for (let i = 0; i < params.files.length; i++) {
    if (params.signal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    const file = params.files[i];
    const res = scanSingleTextContent({
      scanId: params.scanId,
      filePath: file.path,
      content: file.content,
      rules: params.rules,
      settings: params.settings,
      isDemo: params.isDemo,
      detectedAt: params.detectedAt,
    });

    findings.push(...res.findings);
    rawValues.push(...res.rawValues);

    if (i % 5 === 0 || i === params.files.length - 1) {
      params.onProgress?.(i + 1, file.path, findings.length);
      await yieldToMainThread();
    }
  }

  return { findings, rawValues };
}

function runScanInWorker(params: {
  scanId: string;
  files: TextFilePayload[];
  rules: DetectionRule[];
  settings: AppSettings;
  isDemo: boolean;
  detectedAt: string;
  signal?: AbortSignal;
  onProgress?: (processed: number, currentFile: string, findingsCount: number) => void;
}): Promise<{ findings: Finding[]; rawValues: Array<{ id: string; value: string }> }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/scannerWorker.ts', import.meta.url),
      { type: 'module' }
    );

    const cleanup = () => {
      params.signal?.removeEventListener('abort', onAbort);
      worker.terminate();
    };

    const onAbort = () => {
      worker.postMessage({ type: 'CANCEL' });
      cleanup();
      reject(new DOMException('Scan cancelled by user', 'AbortError'));
    };

    if (params.signal?.aborted) {
      cleanup();
      reject(new DOMException('Scan cancelled by user', 'AbortError'));
      return;
    }

    params.signal?.addEventListener('abort', onAbort);

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'PROGRESS') {
        params.onProgress?.(msg.processed, msg.currentFile, msg.findingsCount);
      } else if (msg.type === 'COMPLETE') {
        cleanup();
        resolve({ findings: msg.findings, rawValues: msg.rawValues });
      } else if (msg.type === 'ERROR') {
        cleanup();
        reject(new Error(msg.error || 'Worker scan error'));
      }
    };

    worker.onerror = (err) => {
      cleanup();
      reject(new Error(err.message || 'Web Worker execution error'));
    };

    worker.postMessage({
      type: 'START',
      payload: {
        scanId: params.scanId,
        files: params.files,
        rules: params.rules,
        settings: params.settings,
        isDemo: params.isDemo,
        detectedAt: params.detectedAt,
      },
    });
  });
}
