import React, { useState } from 'react';
import { Check, Copy, Plus, RotateCcw, X } from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';

export const IgnoreConfigView: React.FC = () => {
  const {
    ignoreConfig,
    updateIgnoreConfig,
    resetIgnoreConfig,
    gitignoreAnalysis,
  } = useScanner();

  const [newFolder, setNewFolder] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newExtension, setNewExtension] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [copiedSuggestions, setCopiedSuggestions] = useState(false);

  const addItem = (
    key: 'excludedFolders' | 'excludedFileNames' | 'excludedExtensions' | 'customPatterns',
    val: string,
    clear: () => void
  ) => {
    const trimmed = val.trim().replace(/\/+$/, '');
    if (!trimmed) return;
    const current = ignoreConfig[key];
    if (!current.includes(trimmed)) {
      updateIgnoreConfig({ [key]: [...current, trimmed] });
    }
    clear();
  };

  const removeItem = (
    key: 'excludedFolders' | 'excludedFileNames' | 'excludedExtensions' | 'customPatterns',
    val: string
  ) => {
    updateIgnoreConfig({
      [key]: ignoreConfig[key].filter((item) => item !== val),
    });
  };

  const handleCopySuggested = async () => {
    if (!gitignoreAnalysis || gitignoreAnalysis.suggestedRules.length === 0) return;
    try {
      await navigator.clipboard.writeText(gitignoreAnalysis.suggestedRules.join('\n'));
      setCopiedSuggestions(true);
      setTimeout(() => setCopiedSuggestions(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
            Ignore Configuration &amp; Exclusions
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Control which folders, file types, patterns, and file sizes are excluded before local scanning runs.
          </p>
        </div>
        <button
          type="button"
          onClick={resetIgnoreConfig}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Exclusions</span>
        </button>
      </div>

      {/* File & Archive Size Limits */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Maximum Individual File Size (KB)
          </label>
          <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5 mb-2">
            Files larger than this threshold are skipped with an explicit notice to prevent browser memory stalls.
          </p>
          <input
            type="number"
            min={64}
            max={10240}
            step={64}
            value={Math.round(ignoreConfig.maxFileSizeBytes / 1024)}
            onChange={(e) => {
              const kb = Math.max(64, Number(e.target.value) || 1024);
              updateIgnoreConfig({ maxFileSizeBytes: kb * 1024 });
            }}
            className="w-40 px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Maximum Extracted ZIP Archive Size (MB)
          </label>
          <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5 mb-2">
            Protects against oversized archive expansion in browser memory.
          </p>
          <input
            type="number"
            min={10}
            max={500}
            step={10}
            value={Math.round(ignoreConfig.maxArchiveSizeBytes / (1024 * 1024))}
            onChange={(e) => {
              const mb = Math.max(10, Number(e.target.value) || 100);
              updateIgnoreConfig({ maxArchiveSizeBytes: mb * 1024 * 1024 });
            }}
            className="w-40 px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
          />
        </div>
      </section>

      {/* Exclusion Lists */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'Excluded Folders',
            key: 'excludedFolders' as const,
            placeholder: 'e.g. .cache',
            val: newFolder,
            setVal: setNewFolder,
            suffix: '/',
          },
          {
            title: 'Excluded File Names',
            key: 'excludedFileNames' as const,
            placeholder: 'e.g. composer.lock',
            val: newFileName,
            setVal: setNewFileName,
            suffix: '',
          },
          {
            title: 'Excluded Extensions',
            key: 'excludedExtensions' as const,
            placeholder: 'e.g. .bundle.js',
            val: newExtension,
            setVal: setNewExtension,
            suffix: '',
          },
          {
            title: 'Custom Ignore Patterns (Globs)',
            key: 'customPatterns' as const,
            placeholder: 'e.g. **/generated/**',
            val: newPattern,
            setVal: setNewPattern,
            suffix: '',
          },
        ].map((section) => (
          <div
            key={section.key}
            className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-3"
          >
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              {section.title}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addItem(section.key, section.val, () => section.setVal(''));
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={section.val}
                onChange={(e) => section.setVal(e.target.value)}
                placeholder={section.placeholder}
                className="flex-1 px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {ignoreConfig[section.key].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#161B22] text-slate-800 dark:text-[#E6EDF3]"
                >
                  <span>
                    {item}
                    {section.suffix}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(section.key, item)}
                    aria-label={`Remove ${item}`}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Gitignore Analyzer Details */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              Project .gitignore Analyzer
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5">
              {gitignoreAnalysis
                ? gitignoreAnalysis.hasGitignore
                  ? `Analyzed ${gitignoreAnalysis.parsedPatternsCount} pattern(s) across ${gitignoreAnalysis.gitignoreFiles.join(', ')}.`
                  : 'No .gitignore file was present in the last scanned project.'
                : 'Run a project scan or load the Demo Project to analyze .gitignore coverage for sensitive files.'}
            </p>
          </div>

          {gitignoreAnalysis && gitignoreAnalysis.suggestedRules.length > 0 && (
            <button
              type="button"
              onClick={handleCopySuggested}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] cursor-pointer self-start sm:self-auto"
            >
              {copiedSuggestions ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied Suggested Rules</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Suggested .gitignore Rules</span>
                </>
              )}
            </button>
          )}
        </div>

        {gitignoreAnalysis && gitignoreAnalysis.suggestedRules.length > 0 && (
          <pre className="p-3 rounded border border-slate-200 dark:border-[#222933] bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto">
            {gitignoreAnalysis.suggestedRules.join('\n')}
          </pre>
        )}

        <p className="text-xs text-slate-500 dark:text-[#8B949E]">
          Limitation: Analysis operates solely on selected file paths and available <code className="font-mono">.gitignore</code> contents. It cannot verify whether a file is currently tracked, staged, or stored in Git commit history.
        </p>
      </section>
    </div>
  );
};
