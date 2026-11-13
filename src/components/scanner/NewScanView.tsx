import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileArchive,
  FilePlus2,
  FolderOpen,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { formatBytes } from '../../services/fileService.ts';
import { PrivacyBanner } from '../common/PrivacyNotice.tsx';

export const NewScanView: React.FC = () => {
  const {
    stagedProject,
    stagedClassification,
    stageFilesFromSelection,
    stageFilesFromZip,
    clearStagedProject,
    startScan,
    cancelScan,
    loadAndRunDemoProject,
    resetDemoProject,
    isScanning,
    progress,
    scanError,
    clearScanError,
    ignoreConfig,
    setActiveTab,
  } = useScanner();

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [showExcludedList, setShowExcludedList] = useState(false);

  const supportsDirectoryPicker =
    typeof document !== 'undefined' &&
    'webkitdirectory' in document.createElement('input');

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFilesFromSelection(e.target.files, 'folder');
    }
    e.target.value = '';
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFilesFromSelection(e.target.files, 'files');
    }
    e.target.value = '';
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await stageFilesFromZip(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files;
    if (!dropped || dropped.length === 0) return;

    if (dropped.length === 1 && dropped[0].name.toLowerCase().endsWith('.zip')) {
      await stageFilesFromZip(dropped[0]);
    } else {
      stageFilesFromSelection(dropped, 'files');
    }
  };

  const progressPercent =
    progress.phase === 'extracting'
      ? progress.extractionPercent ?? 0
      : progress.totalFiles > 0
      ? Math.round((progress.processedFiles / progress.totalFiles) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
            New Security Scan
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Select a project folder, upload a ZIP archive, or pick individual files to inspect locally.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAndRunDemoProject}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-md text-xs font-semibold border border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            LOAD DEMO PROJECT
          </button>
          {stagedProject?.isDemo && (
            <button
              type="button"
              onClick={resetDemoProject}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-[#222933] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEMO</span>
            </button>
          )}
        </div>
      </div>

      <PrivacyBanner compact />

      {scanError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 p-4 rounded-lg border border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{scanError}</span>
          </div>
          <button
            type="button"
            onClick={clearScanError}
            className="text-xs underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is standard in Chromium/Firefox/Safari desktop browsers
        webkitdirectory=""
        directory=""
        onChange={handleFolderChange}
        className="hidden"
      />
      <input
        ref={filesInputRef}
        type="file"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleZipChange}
        className="hidden"
      />

      {/* 3 Ingestion Methods */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              A. Folder Selection
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1 leading-relaxed">
              Select a local project directory. Relative file paths are preserved and build folders like <code className="font-mono">node_modules/</code> are filtered automatically.
            </p>
            {!supportsDirectoryPicker && (
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
                Your browser does not support folder selection. Please upload a ZIP archive or individual files instead.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isScanning || !supportsDirectoryPicker}
            onClick={() => folderInputRef.current?.click()}
            className="w-full px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Select Project Folder
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FileArchive className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              B. ZIP Archive Upload
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1 leading-relaxed">
              Extract a <code className="font-mono">.zip</code> project archive locally in browser memory via JSZip. Protected against path traversal and oversized expansion (max {Math.round(ignoreConfig.maxArchiveSizeBytes / (1024 * 1024))} MB).
            </p>
          </div>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => zipInputRef.current?.click()}
            className="w-full px-3.5 py-2 rounded-md text-xs font-semibold border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] hover:bg-slate-100 dark:hover:bg-[#1C222B] text-slate-900 dark:text-[#E6EDF3] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Choose ZIP Archive
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex flex-col justify-between gap-4">
          <div>
            <FilePlus2 className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-3" />
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              C. Individual Files
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#8B949E] mt-1 leading-relaxed">
              Select specific <code className="font-mono">.env</code>, JSON, YAML, Dockerfile, or source files directly. Files are read as text and never executed.
            </p>
          </div>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => filesInputRef.current?.click()}
            className="w-full px-3.5 py-2 rounded-md text-xs font-semibold border border-slate-300 dark:border-[#30363D] bg-slate-50 dark:bg-[#161B22] hover:bg-slate-100 dark:hover:bg-[#1C222B] text-slate-900 dark:text-[#E6EDF3] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Select Multiple Files
          </button>
        </div>
      </section>

      {/* Drag and Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/8'
            : 'border-slate-300 dark:border-[#2B323D] bg-slate-50/50 dark:bg-[#11151B]/60'
        }`}
      >
        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-800 dark:text-[#E6EDF3]">
          Drag and drop a <code className="font-mono text-xs">.zip</code> archive or source files here
        </p>
        <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-1">
          Max individual file size: {Math.round(ignoreConfig.maxFileSizeBytes / 1024).toLocaleString()} KB · Binary files are automatically skipped
        </p>
      </div>

      {/* Extraction / Scan Progress Bar */}
      {(isScanning || progress.phase === 'extracting' || progress.phase === 'cancelled') && (
        <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-[#E6EDF3]">
                {progress.message}
              </p>
              {progress.currentFile && (
                <p className="text-xs font-mono text-slate-500 dark:text-[#8B949E] truncate mt-0.5">
                  {progress.currentFile}
                </p>
              )}
            </div>

            {isScanning && (
              <button
                type="button"
                onClick={cancelScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shrink-0 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Scan</span>
              </button>
            )}
          </div>

          <div className="w-full h-2 rounded bg-slate-200 dark:bg-[#1D232C] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-500 dark:text-[#8B949E]">
            <span>Processed: {progress.processedFiles} / {progress.totalFiles}</span>
            <span>Skipped: {progress.filesSkipped}</span>
            <span>Findings so far: {progress.findingsCount}</span>
          </div>
        </section>
      )}

      {/* Pre-Scan Manifest & Review Exclusion List */}
      {stagedProject && (
        <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
                Staged Project: {stagedProject.projectLabel}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5">
                Review file counts and exclusions before launching the local scanner.{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('ignore-config')}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Edit exclusion rules
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearStagedProject}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                type="button"
                onClick={() => startScan()}
                disabled={isScanning || stagedClassification.supported.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  Run Security Scan ({stagedClassification.supported.length.toLocaleString()} files)
                </span>
              </button>
            </div>
          </div>

          {stagedProject.rejectedTraversalCount ? (
            <div className="p-3 rounded border border-amber-500/35 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300">
              Security notice: {stagedProject.rejectedTraversalCount} archive entry(ies) with unsafe path traversal sequences were blocked and excluded.
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 border-t border-slate-200 dark:border-[#222933]">
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Total Selected</p>
              <p className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {stagedClassification.totalFiles.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Supported Files</p>
              <p className="text-lg font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {stagedClassification.supported.length.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Ignored / Skipped</p>
              <p className="text-lg font-mono font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {stagedClassification.skipped.length.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Total File Size</p>
              <p className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-[#E6EDF3]">
                {formatBytes(stagedClassification.totalBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">Waiting to Scan</p>
              <p className="text-lg font-mono font-bold tabular-nums text-sky-700 dark:text-sky-400">
                {stagedClassification.supported.length.toLocaleString()}
              </p>
            </div>
          </div>

          {stagedClassification.skipped.length > 0 && (
            <div className="border-t border-slate-200 dark:border-[#222933] pt-3">
              <button
                type="button"
                onClick={() => setShowExcludedList((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-[#E6EDF3] hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
              >
                {showExcludedList ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>
                  Review {stagedClassification.skipped.length.toLocaleString()} excluded/skipped file(s)
                </span>
              </button>

              {showExcludedList && (
                <div className="mt-3 max-h-56 overflow-y-auto rounded border border-slate-200 dark:border-[#222933]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-medium">File Path</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        <th className="px-3 py-2 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#222933]">
                      {stagedClassification.skipped.slice(0, 200).map((item, idx) => (
                        <tr key={`${item.path}-${idx}`}>
                          <td className="px-3 py-1.5 font-mono text-slate-800 dark:text-[#E6EDF3] break-all">
                            {item.path}
                          </td>
                          <td className="px-3 py-1.5 font-mono tabular-nums text-slate-500 dark:text-[#8B949E] whitespace-nowrap">
                            {formatBytes(item.size)}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600 dark:text-[#8B949E]">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
