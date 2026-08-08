import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDemoStore } from '@/stores/demoStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LandingPage } from '@/features/landing/LandingPage';
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
import { AIProductIntelligencePage } from '@/features/ai/AIProductIntelligencePage';
import { SimulationBanner } from '@/features/overview/SimulationBanner';
import { SimulationSummaryModal } from '@/features/overview/SimulationSummaryModal';

// App state: 'landing' | 'app'
type AppView = 'landing' | 'app';

function App() {
  const { activeSection, setActiveSection } = useUIStore();
  const { language } = useLanguageStore();
  const { isDemoMode } = useDemoStore();
  const isRTL = language === 'fa';
  const [cmdOpen, setCmdOpen] = useState(false);
  const [view, setView] = useState<AppView>('landing');

  // If demo mode is persisted, go straight to app
  useEffect(() => {
    if (isDemoMode) { setView('app'); setActiveSection('overview'); }
  }, [isDemoMode, setActiveSection]);

  // Sync html dir/lang
  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'fa'  : 'en';
    if (isRTL) document.documentElement.classList.add('font-persian');
    else       document.documentElement.classList.remove('font-persian');
  }, [isRTL]);

  // Global Ctrl+K
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
      case 'overview':             return <OverviewPage onNavigate={handleNavigate} />;
      case 'inventory':            return <InventoryPage />;
      case 'expiry':               return <ExpiryPage />;
      case 'operations':           return <OperationsPage />;
      case 'workflows':            return <WorkflowsPage />;
      case 'product-intelligence': return <AIProductIntelligencePage />;
      case 'activity':             return <ActivityPage />;
      case 'analytics':            return <AnalyticsPage />;
      case 'storehealth':          return <StoreHealthPage />;
      case 'insights':             return <InsightsPage />;
      case 'settings':             return <SettingsPage />;
      default:                     return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  const isWorkflows = activeSection === 'workflows';
  const fontFamily = isRTL
    ? "'Vazirmatn', 'Inter', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";

  // ── Landing page ────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily }}>
        <LandingPage onEnterApp={() => { setView('app'); setActiveSection('overview'); }} />
      </div>
    );
  }

  // ── Main app ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily }}
    >
      <Sidebar onNavigate={handleNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onNavigate={handleNavigate} onOpenCommand={() => setCmdOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {isWorkflows ? (
            <div className="h-full flex flex-col">
              <div className="px-4 sm:px-6 pt-4 max-w-screen-2xl w-full mx-auto">
                <SimulationBanner />
              </div>
              {renderPage()}
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-5 max-w-screen-2xl mx-auto pb-20 md:pb-6">
              <SimulationBanner />
              {renderPage()}
            </div>
          )}
        </main>
      </div>

      <AIAssistantPanel />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={handleNavigate} />
      <SimulationSummaryModal />
    </div>
  );
}

export default App;

