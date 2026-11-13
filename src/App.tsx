import React, { useState } from 'react';
import { ScannerProvider, useScanner } from './context/ScannerContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopNav } from './components/layout/TopNav.tsx';
import { OverviewView } from './components/dashboard/OverviewView.tsx';
import { NewScanView } from './components/scanner/NewScanView.tsx';
import { ScanResultsView } from './components/dashboard/ScanResultsView.tsx';
import { FindingsExplorerView } from './components/findings/FindingsExplorerView.tsx';
import { RulesDetectionView } from './components/rules/RulesDetectionView.tsx';
import { IgnoreConfigView } from './components/ignore-config/IgnoreConfigView.tsx';
import { ScanHistoryView } from './components/history/ScanHistoryView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';

const WorkspaceShell: React.FC = () => {
  const { activeTab } = useScanner();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'new-scan':
        return <NewScanView />;
      case 'scan-results':
        return <ScanResultsView />;
      case 'findings':
        return <FindingsExplorerView />;
      case 'rules':
        return <RulesDetectionView />;
      case 'ignore-config':
        return <IgnoreConfigView />;
      case 'history':
        return <ScanHistoryView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1400px] mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ScannerProvider>
      <WorkspaceShell />
    </ScannerProvider>
  );
}
