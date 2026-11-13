export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type Confidence = 'High' | 'Medium' | 'Low';

export type RuleCategory =
  | 'Cloud Credentials'
  | 'API Authentication'
  | 'Database Credentials'
  | 'Private Key Exposure'
  | 'Generic Password Assignment'
  | 'Webhook Credentials'
  | 'Configuration Secrets'
  | 'High Entropy Values';

export type FindingStatus =
  | 'OPEN'
  | 'REVIEWED'
  | 'FALSE POSITIVE'
  | 'ACCEPTED RISK'
  | 'RESOLVED';

export type NavigationTab =
  | 'overview'
  | 'new-scan'
  | 'scan-results'
  | 'findings'
  | 'rules'
  | 'ignore-config'
  | 'history'
  | 'reports'
  | 'settings';

export interface DetectionRule {
  id: string;
  name: string;
  category: RuleCategory;
  description: string;
  severity: Severity;
  pattern: string;
  flags?: string;
  baseConfidence: Confidence;
  remediation: string[];
  enabled: boolean;
  isCustom?: boolean;
  isHeuristic?: boolean;
  captureGroup?: number;
  requiresSecretContext?: boolean;
}

export interface CustomRuleInput {
  name: string;
  category: RuleCategory;
  description: string;
  severity: Severity;
  pattern: string;
  baseConfidence: Confidence;
  remediation: string;
}

export interface ContextLine {
  lineNumber: number;
  maskedContent: string;
  isMatchLine: boolean;
}

export interface Finding {
  id: string;
  scanId: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  filePath: string;
  fileExtension: string;
  lineNumber: number;
  columnNumber: number;
  matchLength: number;
  severity: Severity;
  confidence: Confidence;
  confidenceScore: number;
  explanation: string;
  maskedPreview: string;
  maskedValue: string;
  contextLines: ContextLine[];
  remediation: string[];
  status: FindingStatus;
  detectedAt: string;
  isHeuristicOnly?: boolean;
  isDemo?: boolean;
}

export interface SkippedFileInfo {
  path: string;
  size: number;
  reason: string;
}

export interface ProjectFileInput {
  path: string;
  name: string;
  size: number;
  content?: string;
  file?: File;
}

export interface IgnoreConfig {
  excludedFolders: string[];
  excludedFileNames: string[];
  excludedExtensions: string[];
  customPatterns: string[];
  maxFileSizeBytes: number;
  maxArchiveSizeBytes: number;
}

export interface SeverityCounts {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  INFO: number;
}

export interface CategoryBreakdownItem {
  category: RuleCategory;
  count: number;
}

export interface AffectedFileItem {
  filePath: string;
  count: number;
  highestSeverity: Severity;
}

export interface ScanSummary {
  scanId: string;
  projectLabel: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalFilesSelected: number;
  filesScanned: number;
  filesSkipped: number;
  totalBytesSelected: number;
  totalBytesScanned: number;
  rulesExecuted: number;
  totalFindings: number;
  severityCounts: SeverityCounts;
  isDemo: boolean;
  cancelled?: boolean;
}

export interface ScanProgress {
  phase: 'idle' | 'extracting' | 'filtering' | 'scanning' | 'finalizing' | 'complete' | 'cancelled' | 'error';
  totalFiles: number;
  processedFiles: number;
  filesScanned: number;
  filesSkipped: number;
  findingsCount: number;
  currentFile: string;
  message: string;
  extractionPercent?: number;
}

export interface GitignoreRuleMatch {
  pattern: string;
  sourceFile: string;
}

export interface SensitiveFileCheck {
  filePath: string;
  reason: string;
  covered: boolean;
  matchedRule?: string;
  suggestedRule: string;
}

export interface GitignoreAnalysisResult {
  hasGitignore: boolean;
  gitignoreFiles: string[];
  parsedPatternsCount: number;
  sensitiveFilesFound: SensitiveFileCheck[];
  uncoveredCount: number;
  suggestedRules: string[];
}

export interface ScanHistoryEntry {
  scanId: string;
  projectLabel: string;
  scanDate: string;
  filesScanned: number;
  filesSkipped: number;
  totalFiles: number;
  findingsCount: number;
  severitySummary: SeverityCounts;
  durationMs: number;
  isDemo: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  useWebWorker: boolean;
  entropyMinLength: number;
  entropyThreshold: number;
  enableEntropyHeuristic: boolean;
  contextLinesRadius: number;
}

export interface FindingFilters {
  search: string;
  severity: Severity | 'ALL';
  category: RuleCategory | 'ALL';
  confidence: Confidence | 'ALL';
  extension: string | 'ALL';
  status: FindingStatus | 'ALL';
  sortBy: 'severity' | 'confidence' | 'filename' | 'line';
}
