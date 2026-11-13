import React from 'react';
import {
  Activity,
  FileCode2,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  Play,
  Settings,
  Shield,
  Sliders,
  X,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { NavigationTab } from '../../types/index.ts';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC<{
  mobileOpen: boolean;
  onCloseMobile: () => void;
}> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, findings, currentSummary, history } =
    useScanner();

  const openFindingsCount = findings.filter((f) => f.status === 'OPEN').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'new-scan',
      label: 'New Scan',
      icon: <Play className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'scan-results',
      label: 'Scan Results',
      icon: <Activity className="w-4 h-4 shrink-0" />,
      badge: currentSummary ? currentSummary.totalFindings : undefined,
    },
    {
      id: 'findings',
      label: 'Findings Explorer',
      icon: <FileCode2 className="w-4 h-4 shrink-0" />,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined,
    },
    {
      id: 'rules',
      label: 'Rules & Detection',
      icon: <Sliders className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'ignore-config',
      label: 'Ignore Configuration',
      icon: <Filter className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'history',
      label: 'Scan History',
      icon: <History className="w-4 h-4 shrink-0" />,
      badge: history.length > 0 ? history.length : undefined,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleSelect = (id: NavigationTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#11151B] border-r border-slate-200 dark:border-[#222933] w-64 shrink-0">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-[#222933]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-600/12 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-[#E6EDF3] block leading-none">
              KeyFence
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#8B949E] block mt-1">
              Find It. Fix It. Secure It.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                  : 'text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-[#E6EDF3] hover:bg-slate-100 dark:hover:bg-[#161B22] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && (
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-[#8B949E] ml-2">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3.5 border-t border-slate-200 dark:border-[#222933] text-xs text-slate-500 dark:text-[#8B949E] space-y-1">
        <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
          Browser-Only Engine
        </p>
        <p className="leading-relaxed">
          Files stay in local memory. No network uploads or code execution.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-full">{sidebarContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
