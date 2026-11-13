import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppSettings,
  CustomRuleInput,
  DetectionRule,
  Finding,
  FindingFilters,
  FindingStatus,
  GitignoreAnalysisResult,
  IgnoreConfig,
  NavigationTab,
  ProjectFileInput,
  ScanHistoryEntry,
  ScanProgress,
  ScanSummary,
  SkippedFileInfo,
} from '../types/index.ts';
import {
  BUILTIN_DETECTION_RULES,
  createCustomRule,
} from '../services/detectionRules.ts';
import {
  classifyProjectFiles,
  DEFAULT_IGNORE_CONFIG,
} from '../services/fileService.ts';
import { extractZipArchive } from '../services/zipService.ts';
import { runProjectScan } from '../services/scannerEngine.ts';
import { analyzeGitignoreCoverage } from '../services/gitignoreAnalyzer.ts';
import {
  clearAllScanHistory,
  deleteHistoryEntry,
  loadScanHistory,
  saveScanToHistory,
} from '../services/historyService.ts';
import { getDemoProjectFiles } from '../services/demoProjectService.ts';

const SETTINGS_KEY = 'keyfence_settings_v1';
const IGNORE_CONFIG_KEY = 'keyfence_ignore_config_v1';
const CUSTOM_RULES_KEY = 'keyfence_custom_rules_v1';
const DISABLED_RULES_KEY = 'keyfence_disabled_rules_v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  useWebWorker: true,
  entropyMinLength: 20,
  entropyThreshold: 3.8,
  enableEntropyHeuristic: true,
  contextLinesRadius: 3,
};

const DEFAULT_FILTERS: FindingFilters = {
  search: '',
  severity: 'ALL',
  category: 'ALL',
  confidence: 'ALL',
  extension: 'ALL',
  status: 'ALL',
  sortBy: 'severity',
};

const IDLE_PROGRESS: ScanProgress = {
  phase: 'idle',
  totalFiles: 0,
  processedFiles: 0,
  filesScanned: 0,
  filesSkipped: 0,
  findingsCount: 0,
  currentFile: '',
  message: 'Ready to scan local files.',
};

interface StagedProject {
  projectLabel: string;
  inputs: ProjectFileInput[];
  preSkipped: SkippedFileInfo[];
  isDemo: boolean;
  rejectedTraversalCount?: number;
}

interface ScannerContextValue {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  resetAllSettings: () => void;

  rules: DetectionRule[];
  toggleRuleEnabled: (ruleId: string) => void;
  addCustomRule: (input: CustomRuleInput) => DetectionRule;
  deleteCustomRule: (ruleId: string) => void;
  resetRulesToDefault: () => void;

  ignoreConfig: IgnoreConfig;
  updateIgnoreConfig: (patch: Partial<IgnoreConfig>) => void;
  resetIgnoreConfig: () => void;

  stagedProject: StagedProject | null;
  stagedClassification: {
    supported: ProjectFileInput[];
    skipped: SkippedFileInfo[];
    totalBytes: number;
    totalFiles: number;
  };
  stageFilesFromSelection: (fileList: FileList, sourceType: 'folder' | 'files') => void;
  stageFilesFromZip: (zipFile: File) => Promise<void>;
  clearStagedProject: () => void;

  startScan: (overrideStaged?: StagedProject) => Promise<void>;
  cancelScan: () => void;
  loadAndRunDemoProject: () => Promise<void>;
  resetDemoProject: () => void;

  progress: ScanProgress;
  scanError: string | null;
  clearScanError: () => void;
  isScanning: boolean;

  currentSummary: ScanSummary | null;
  findings: Finding[];
  skippedFiles: SkippedFileInfo[];
  gitignoreAnalysis: GitignoreAnalysisResult | null;

  filters: FindingFilters;
  setFilters: React.Dispatch<React.SetStateAction<FindingFilters>>;
  resetFilters: () => void;
  selectedFindingId: string | null;
  setSelectedFindingId: (id: string | null) => void;
  updateFindingStatus: (findingId: string, status: FindingStatus) => void;
  getEphemeralRawSecret: (findingId: string) => string | null;

  history: ScanHistoryEntry[];
  removeHistoryEntry: (scanId: string) => void;
  clearHistory: () => void;
}

const ScannerContext = createContext<ScannerContextValue | null>(null);

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function loadStoredArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadStoredJson<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
  );
  const [ignoreConfig, setIgnoreConfig] = useState<IgnoreConfig>(() =>
    loadStoredJson<IgnoreConfig>(IGNORE_CONFIG_KEY, DEFAULT_IGNORE_CONFIG)
  );

  const [rules, setRules] = useState<DetectionRule[]>(() => {
    const disabledIds = new Set(loadStoredArray<string>(DISABLED_RULES_KEY));
    const customRules = loadStoredArray<DetectionRule>(CUSTOM_RULES_KEY);
    const mergedBuiltins = BUILTIN_DETECTION_RULES.map((r) => ({
      ...r,
      enabled: !disabledIds.has(r.id),
    }));
    return [...mergedBuiltins, ...customRules];
  });

  const [stagedProject, setStagedProject] = useState<StagedProject | null>(null);
  const [progress, setProgress] = useState<ScanProgress>(IDLE_PROGRESS);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [currentSummary, setCurrentSummary] = useState<ScanSummary | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<SkippedFileInfo[]>([]);
  const [gitignoreAnalysis, setGitignoreAnalysis] =
    useState<GitignoreAnalysisResult | null>(null);

  const [filters, setFilters] = useState<FindingFilters>(DEFAULT_FILTERS);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>(() => loadScanHistory());

  // Ephemeral in-memory only store for optional explicit reveal. Never persisted or exported.
  const ephemeralRawValuesRef = useRef<Map<string, string>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures
    }
  }, [settings]);

  // Persist ignore configuration (metadata only)
  useEffect(() => {
    try {
      localStorage.setItem(IGNORE_CONFIG_KEY, JSON.stringify(ignoreConfig));
    } catch {
      // Ignore
    }
  }, [ignoreConfig]);

  // Persist rule enabled flags and custom regex definitions (no secrets)
  useEffect(() => {
    try {
      const disabledIds = rules.filter((r) => !r.enabled).map((r) => r.id);
      const customRules = rules.filter((r) => r.isCustom);
      localStorage.setItem(DISABLED_RULES_KEY, JSON.stringify(disabledIds));
      localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(customRules));
    } catch {
      // Ignore
    }
  }, [rules]);

  // Wipe ephemeral memory on unmount
  useEffect(() => {
    return () => {
      ephemeralRawValuesRef.current.clear();
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const resetAllSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const toggleRuleEnabled = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const addCustomRule = useCallback((input: CustomRuleInput): DetectionRule => {
    const rule = createCustomRule(input);
    setRules((prev) => [...prev, rule]);
    return rule;
  }, []);

  const deleteCustomRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => !(r.id === ruleId && r.isCustom)));
  }, []);

  const resetRulesToDefault = useCallback(() => {
    setRules(BUILTIN_DETECTION_RULES.map((r) => ({ ...r, enabled: true })));
  }, []);

  const updateIgnoreConfig = useCallback((patch: Partial<IgnoreConfig>) => {
    setIgnoreConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetIgnoreConfig = useCallback(() => {
    setIgnoreConfig(DEFAULT_IGNORE_CONFIG);
  }, []);

  const stagedClassification = useMemo(() => {
    if (!stagedProject) {
      return { supported: [], skipped: [], totalBytes: 0, totalFiles: 0 };
    }
    const res = classifyProjectFiles(stagedProject.inputs, ignoreConfig);
    const combinedSkipped = [...stagedProject.preSkipped, ...res.skipped];
    const preBytes = stagedProject.preSkipped.reduce((sum, s) => sum + s.size, 0);
    return {
      supported: res.supported,
      skipped: combinedSkipped,
      totalBytes: res.totalBytes + preBytes,
      totalFiles: stagedProject.inputs.length + stagedProject.preSkipped.length,
    };
  }, [stagedProject, ignoreConfig]);

  const stageFilesFromSelection = useCallback(
    (fileList: FileList, sourceType: 'folder' | 'files') => {
      setScanError(null);
      if (!fileList || fileList.length === 0) {
        setScanError('No files were selected.');
        return;
      }

      const inputs: ProjectFileInput[] = [];
      let inferredLabel =
        sourceType === 'folder' ? 'Selected Folder' : `${fileList.length} Selected Files`;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relPath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;

        if (i === 0 && sourceType === 'folder' && relPath.includes('/')) {
          inferredLabel = relPath.split('/')[0];
        }

        inputs.push({
          path: relPath,
          name: file.name,
          size: file.size,
          file,
        });
      }

      setStagedProject({
        projectLabel: inferredLabel,
        inputs,
        preSkipped: [],
        isDemo: false,
      });
      setProgress({
        ...IDLE_PROGRESS,
        totalFiles: inputs.length,
        message: `Staged ${inputs.length.toLocaleString()} file(s) from ${inferredLabel}. Ready to scan.`,
      });
    },
    []
  );

  const stageFilesFromZip = useCallback(
    async (zipFile: File) => {
      setScanError(null);
      if (!zipFile) {
        setScanError('No ZIP archive was selected.');
        return;
      }
      if (!zipFile.name.toLowerCase().endsWith('.zip')) {
        setScanError('Unsupported archive format. Please upload a valid .zip file.');
        return;
      }

      setProgress({
        phase: 'extracting',
        totalFiles: 0,
        processedFiles: 0,
        filesScanned: 0,
        filesSkipped: 0,
        findingsCount: 0,
        currentFile: zipFile.name,
        message: `Extracting ${zipFile.name} locally in browser memory...`,
        extractionPercent: 0,
      });

      try {
        const result = await extractZipArchive(
          zipFile,
          zipFile.name,
          ignoreConfig,
          (percent, currentEntry) => {
            setProgress((prev) => ({
              ...prev,
              phase: 'extracting',
              currentFile: currentEntry,
              extractionPercent: percent,
              message: `Extracting archive locally (${percent}%)...`,
            }));
          }
        );

        setStagedProject({
          projectLabel: result.projectLabel,
          inputs: result.files,
          preSkipped: result.skipped,
          isDemo: false,
          rejectedTraversalCount: result.rejectedTraversalCount,
        });

        setProgress({
          ...IDLE_PROGRESS,
          totalFiles: result.totalEntries,
          filesSkipped: result.skipped.length,
          message: `Extracted ${result.files.length.toLocaleString()} scannable file(s) from ${zipFile.name}.`,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to extract ZIP archive.';
        setScanError(msg);
        setProgress({
          ...IDLE_PROGRESS,
          phase: 'error',
          message: msg,
        });
      }
    },
    [ignoreConfig]
  );

  const clearStagedProject = useCallback(() => {
    setStagedProject(null);
    setScanError(null);
    setProgress(IDLE_PROGRESS);
  }, []);

  const startScan = useCallback(
    async (overrideStaged?: StagedProject) => {
      const target = overrideStaged ?? stagedProject;
      if (!target || (target.inputs.length === 0 && target.preSkipped.length === 0)) {
        setScanError('No project files staged. Select a folder, upload a ZIP archive, or load the Demo Project.');
        return;
      }

      if (rules.every((r) => !r.enabled)) {
        setScanError('All detection rules are currently disabled. Enable at least one rule before scanning.');
        return;
      }

      setScanError(null);
      setIsScanning(true);
      setSelectedFindingId(null);
      ephemeralRawValuesRef.current.clear();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await runProjectScan({
          projectLabel: target.projectLabel,
          inputs: target.inputs,
          preSkipped: target.preSkipped,
          rules,
          ignoreConfig,
          settings,
          isDemo: target.isDemo,
          signal: controller.signal,
          onProgress: (p) => setProgress(p),
        });

        ephemeralRawValuesRef.current = result.ephemeralRawValues;
        setCurrentSummary(result.summary);
        setFindings(result.findings);
        setSkippedFiles(result.skippedFiles);

        // Run Gitignore coverage analyzer across all selected/known paths
        const allPaths = [
          ...target.inputs.map((i) => i.path),
          ...target.preSkipped.map((s) => s.path),
        ];
        const giAnalysis = analyzeGitignoreCoverage(allPaths, result.gitignoreContents);
        setGitignoreAnalysis(giAnalysis);

        const updatedHistory = saveScanToHistory(result.summary);
        setHistory(updatedHistory);
        setActiveTab('scan-results');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setProgress((prev) => ({
            ...prev,
            phase: 'cancelled',
            message: 'Scan cancelled by user.',
          }));
        } else {
          const msg = err instanceof Error ? err.message : 'An error occurred during scanning.';
          setScanError(msg);
          setProgress((prev) => ({
            ...prev,
            phase: 'error',
            message: msg,
          }));
        }
      } finally {
        setIsScanning(false);
        abortControllerRef.current = null;
      }
    },
    [stagedProject, rules, ignoreConfig, settings]
  );

  const cancelScan = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const loadAndRunDemoProject = useCallback(async () => {
    const demoInputs = getDemoProjectFiles();
    const demoStaged: StagedProject = {
      projectLabel: 'KeyFence Demo Service (Fictional)',
      inputs: demoInputs,
      preSkipped: [],
      isDemo: true,
    };
    setStagedProject(demoStaged);
    await startScan(demoStaged);
  }, [startScan]);

  const resetDemoProject = useCallback(() => {
    ephemeralRawValuesRef.current.clear();
    if (currentSummary?.isDemo) {
      setCurrentSummary(null);
      setFindings([]);
      setSkippedFiles([]);
      setGitignoreAnalysis(null);
      setSelectedFindingId(null);
    }
    if (stagedProject?.isDemo) {
      setStagedProject(null);
    }
    setProgress(IDLE_PROGRESS);
    setScanError(null);
  }, [currentSummary, stagedProject]);

  const clearScanError = useCallback(() => setScanError(null), []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const updateFindingStatus = useCallback(
    (findingId: string, status: FindingStatus) => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, status } : f))
      );
    },
    []
  );

  const getEphemeralRawSecret = useCallback((findingId: string): string | null => {
    return ephemeralRawValuesRef.current.get(findingId) ?? null;
  }, []);

  const removeHistoryEntry = useCallback((scanId: string) => {
    setHistory(deleteHistoryEntry(scanId));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(clearAllScanHistory());
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        toggleTheme,
        resetAllSettings,
        rules,
        toggleRuleEnabled,
        addCustomRule,
        deleteCustomRule,
        resetRulesToDefault,
        ignoreConfig,
        updateIgnoreConfig,
        resetIgnoreConfig,
        stagedProject,
        stagedClassification,
        stageFilesFromSelection,
        stageFilesFromZip,
        clearStagedProject,
        startScan,
        cancelScan,
        loadAndRunDemoProject,
        resetDemoProject,
        progress,
        scanError,
        clearScanError,
        isScanning,
        currentSummary,
        findings,
        skippedFiles,
        gitignoreAnalysis,
        filters,
        setFilters,
        resetFilters,
        selectedFindingId,
        setSelectedFindingId,
        updateFindingStatus,
        getEphemeralRawSecret,
        history,
        removeHistoryEntry,
        clearHistory,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export function useScanner(): ScannerContextValue {
  const ctx = useContext(ScannerContext);
  if (!ctx) {
    throw new Error('useScanner must be used inside a ScannerProvider');
  }
  return ctx;
}
