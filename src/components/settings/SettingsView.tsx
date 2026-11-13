import React from 'react';
import { Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllSettings,
    clearHistory,
    resetIgnoreConfig,
    resetRulesToDefault,
  } = useScanner();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
            Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Configure local scanning behavior, entropy heuristics, and interface preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAllSettings}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Preferences</span>
        </button>
      </div>

      {/* Appearance */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Interface Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8B949E] mt-0.5">
            Dark graphite is the default developer theme. Switch to light mode anytime.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-md bg-slate-100 dark:bg-[#0B0D10] border border-slate-200 dark:border-[#222933]">
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
              settings.theme === 'dark'
                ? 'bg-[#161B22] text-white'
                : 'text-slate-600 dark:text-[#8B949E]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
              settings.theme === 'light'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-[#8B949E]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
        </div>
      </section>

      {/* Scanner Performance & Heuristics */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-5">
        <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
          Scanner Engine &amp; Entropy Heuristics
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-900 dark:text-[#E6EDF3]">
              Use Web Worker for Background Scanning
            </p>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Keeps the interface responsive during large scans. Falls back automatically to chunked main-thread scanning if unavailable.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.useWebWorker}
            onClick={() => updateSettings({ useWebWorker: !settings.useWebWorker })}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold border cursor-pointer ${
              settings.useWebWorker
                ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-[#30363D] text-slate-500'
            }`}
          >
            {settings.useWebWorker ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#222933]">
          <div>
            <p className="text-xs font-medium text-slate-900 dark:text-[#E6EDF3]">
              Enable High-Entropy Heuristic Analysis
            </p>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Detects unfamiliar high-randomness tokens above the Shannon entropy threshold. Marked separately as heuristic-only.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enableEntropyHeuristic}
            onClick={() =>
              updateSettings({
                enableEntropyHeuristic: !settings.enableEntropyHeuristic,
              })
            }
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold border cursor-pointer ${
              settings.enableEntropyHeuristic
                ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-[#30363D] text-slate-500'
            }`}
          >
            {settings.enableEntropyHeuristic ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-[#222933]">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
              Entropy Minimum Token Length
            </label>
            <input
              type="number"
              min={12}
              max={64}
              value={settings.entropyMinLength}
              onChange={(e) =>
                updateSettings({
                  entropyMinLength: Math.max(12, Math.min(64, Number(e.target.value) || 20)),
                })
              }
              className="w-full px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
              Shannon Entropy Threshold
            </label>
            <input
              type="number"
              min={3.0}
              max={5.5}
              step={0.1}
              value={settings.entropyThreshold}
              onChange={(e) =>
                updateSettings({
                  entropyThreshold: Math.max(3.0, Math.min(5.5, Number(e.target.value) || 3.8)),
                })
              }
              className="w-full px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
              Code Context Lines (+/-)
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={settings.contextLinesRadius}
              onChange={(e) =>
                updateSettings({
                  contextLinesRadius: Math.max(1, Math.min(8, Number(e.target.value) || 3)),
                })
              }
              className="w-full px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
            />
          </div>
        </div>
      </section>

      {/* Local Browser Storage Management */}
      <section className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] p-5 space-y-3">
        <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
          Local Browser Storage
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#8B949E]">
          Only preferences, custom regex rules, exclusion lists, and metadata-only scan summaries are saved locally. Zero raw secrets or source code are ever persisted.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              clearHistory();
              resetIgnoreConfig();
              resetRulesToDefault();
              resetAllSettings();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Local Configuration &amp; History</span>
          </button>
        </div>
      </section>
    </div>
  );
};
