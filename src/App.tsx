import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { ExpiryPage } from '@/features/expiry/ExpiryPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { WorkflowsPage } from '@/features/workflows/WorkflowsPage';
import { ActivityPage } from '@/features/activity/ActivityPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AIAssistantPanel } from '@/features/ai/AIAssistantPanel';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { StoreHealthPage } from '@/features/storehealth/StoreHealthPage';
import { InsightsPage } from '@/features/analytics/InsightsPage';

function App() {
  const { activeSection, setActiveSection } = useUIStore();
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';
  const [cmdOpen, setCmdOpen] = useState(false);

  // Sync html dir/lang
  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'fa'  : 'en';
    if (isRTL) document.documentElement.classList.add('font-persian');
    else       document.documentElement.classList.remove('font-persian');
  }, [isRTL]);

  // Global Ctrl+K listener
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActiveSection]);

  const renderPage = () => {
    switch (activeSection) {
      case 'overview':   return <OverviewPage onNavigate={handleNavigate} />;
      case 'inventory':  return <InventoryPage />;
      case 'expiry':     return <ExpiryPage />;
      case 'operations': return <OperationsPage />;
      case 'workflows':  return <WorkflowsPage />;
      case 'activity':   return <ActivityPage />;
      case 'analytics':    return <AnalyticsPage />;
      case 'insights':     return <InsightsPage />;
      case 'storehealth':  return <StoreHealthPage />;
      case 'settings':     return <SettingsPage />;
      default:           return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  const isWorkflows = activeSection === 'workflows';

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? "'Vazirmatn', 'Inter', system-ui, sans-serif" : "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar onNavigate={handleNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onNavigate={handleNavigate} onOpenCommand={() => setCmdOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {isWorkflows ? (
            <div className="h-full flex flex-col">
              {renderPage()}
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-5 max-w-screen-2xl mx-auto pb-20 md:pb-6">
              {renderPage()}
            </div>
          )}
        </main>
      </div>

      {/* Global overlays */}
      <AIAssistantPanel />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default App;
