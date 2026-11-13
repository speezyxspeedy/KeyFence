import React from 'react';
import {
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';

export const TopNav: React.FC<{ onOpenMobileNav: () => void }> = ({
  onOpenMobileNav,
}) => {
  const {
    settings,
    toggleTheme,
    setActiveTab,
    stagedProject,
    currentSummary,
    isScanning,
    progress,
    filters,
    setFilters,
  } = useScanner();

  const workspaceLabel =
    currentSummary?.projectLabel ||
    stagedProject?.projectLabel ||
    'Local Workspace';

  const handleGlobalSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (value.trim().length > 0 && currentSummary) {
      setActiveTab('findings');
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#11151B] border-b border-slate-200 dark:border-[#222933] flex items-center justify-between gap-4 shrink-0 no-print">
      {/* Left: Mobile menu toggle + Workspace name + Privacy check */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-md text-slate-600 dark:text-[#8B949E] hover:bg-slate-100 dark:hover:bg-[#161B22]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-[#E6EDF3]">
            <span className="truncate max-w-[200px] sm:max-w-[280px]">
              {workspaceLabel}
            </span>
            {currentSummary?.isDemo && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300 shrink-0">
                DEMO
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              LOCAL PROCESSING — YOUR FILES STAY IN YOUR BROWSER
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            placeholder="Search findings by file, rule, category, or ID..."
            aria-label="Global findings search"
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-slate-100 dark:bg-[#0B0D10] border border-slate-200 dark:border-[#222933] text-slate-900 dark:text-[#E6EDF3] placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Right: Scan Status, Theme, Settings, Primary CTA */}
      <div className="flex items-center gap-2 shrink-0">
        {isScanning ? (
          <span className="hidden xl:inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded border border-sky-500/30 bg-sky-500/10 tabular-nums whitespace-nowrap">
            Scanning {progress.processedFiles}/{progress.totalFiles}
          </span>
        ) : currentSummary ? (
          <span className="hidden xl:inline-flex items-center text-xs font-mono text-slate-500 dark:text-[#8B949E] px-2.5 py-1 tabular-nums whitespace-nowrap">
            {currentSummary.filesScanned} scanned · {currentSummary.totalFindings} findings
          </span>
        ) : null}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
          title={
            settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
          className="p-2 rounded-md border border-slate-200 dark:border-[#222933] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-[#E6EDF3] hover:bg-slate-100 dark:hover:bg-[#161B22] transition-colors"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          aria-label="Open settings"
          title="Settings"
          className="p-2 rounded-md border border-slate-200 dark:border-[#222933] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-[#E6EDF3] hover:bg-slate-100 dark:hover:bg-[#161B22] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new-scan')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>NEW SECURITY SCAN</span>
        </button>
      </div>
    </header>
  );
};
