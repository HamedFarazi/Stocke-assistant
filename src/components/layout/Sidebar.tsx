import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAppStore } from '@/stores/appStore';
import { useAIStore } from '@/stores/aiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  LayoutDashboard, Package, AlertTriangle, ClipboardList,
  GitBranch, Activity, BarChart3, Settings, ChevronLeft,
  Leaf, Store, Sparkles, ShieldCheck, Brain, Menu, X, Zap,
} from 'lucide-react';
import { stores } from '@/data/stores';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onNavigate: (section: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { sidebarOpen, toggleSidebar, activeSection } = useUIStore();
  const { operations, currentStoreId } = useAppStore();
  const { setPanelOpen } = useAIStore();
  const { t, isRTL } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const currentStore = stores.find(s => s.id === currentStoreId);
  const pendingOps = operations.filter(o => o.status === 'pending' || o.status === 'in-progress').length;

  const navItems = [
    { id: 'overview',             label: t.nav.overview,            icon: <LayoutDashboard size={16} /> },
    { id: 'inventory',            label: t.nav.inventory,           icon: <Package size={16} /> },
    { id: 'expiry',               label: t.nav.expiry,              icon: <AlertTriangle size={16} /> },
    { id: 'operations',           label: t.nav.operations,          icon: <ClipboardList size={16} />, badge: pendingOps },
    { id: 'workflows',            label: t.nav.workflows,           icon: <GitBranch size={16} /> },
    { id: 'product-intelligence', label: isRTL ? 'هوش مصنوعی محصول' : 'AI Product Intelligence', icon: <Sparkles size={16} /> },
    { id: 'storehealth',          label: isRTL ? 'سلامت فروشگاه'    : 'Store Health', icon: <ShieldCheck size={16} /> },
    { id: 'insights',             label: isRTL ? 'تحلیل AI'          : 'AI Insights',  icon: <Brain size={16} /> },
    { id: 'activity',             label: t.nav.activity,            icon: <Activity size={16} /> },
    { id: 'analytics',            label: t.nav.analytics,           icon: <BarChart3 size={16} /> },
    { id: 'settings',             label: t.nav.settings,            icon: <Settings size={16} /> },
  ];

  const primaryMobileTabs = [
    { id: 'overview',             label: isRTL ? 'داشبورد' : 'Overview',       icon: <LayoutDashboard size={18} /> },
    { id: 'inventory',            label: isRTL ? 'موجودی' : 'Inventory',       icon: <Package size={18} /> },
    { id: 'operations',           label: isRTL ? 'عملیات' : 'Operations',      icon: <ClipboardList size={18} />, badge: pendingOps },
    { id: 'product-intelligence', label: isRTL ? 'هوش مصنوعی' : 'AI Intel',   icon: <Sparkles size={18} /> },
  ];

  const chevronClass = cn('transition-transform', isRTL ? 'rotate-180' : '');

  function triggerFlash() {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 550);
  }

  function handleCloseMenu() {
    setMobileMenuOpen(false);
    triggerFlash();
  }

  function handleMobileNav(sectionId: string) {
    onNavigate(sectionId);
    handleCloseMenu();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-full bg-white border-slate-200 transition-all duration-200 flex-shrink-0',
          isRTL ? 'border-l' : 'border-r',
          sidebarOpen ? 'w-56' : 'w-14'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-14 border-b border-slate-100 flex-shrink-0 px-3',
          isRTL ? 'flex-row-reverse justify-between' : 'justify-between'
        )}>
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 8 : -8 }}
                transition={{ duration: 0.15 }}
                className={cn('flex items-center gap-2 overflow-hidden', isRTL && 'flex-row-reverse')}
              >
                <div className="w-7 h-7 rounded-md bg-green-700 flex items-center justify-center flex-shrink-0">
                  <Leaf size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900 tracking-tight">FreshFlow</span>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <div className="w-7 h-7 rounded-md bg-green-700 flex items-center justify-center mx-auto">
              <Leaf size={14} className="text-white" />
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={14} className={chevronClass} />
            </button>
          )}
        </div>

        {/* Store selector */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-slate-100">
            <div className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-50 text-xs text-slate-600',
              isRTL && 'flex-row-reverse'
            )}>
              <Store size={12} className="text-slate-400 flex-shrink-0" />
              <span className="truncate font-medium">{currentStore?.name ?? 'Select Store'}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <Tooltip
              key={item.id}
              content={item.label}
              placement={isRTL ? 'left' : 'right'}
              disabled={sidebarOpen}
            >
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                  isRTL ? 'flex-row-reverse text-right' : 'text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600',
                  activeSection === item.id
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className={cn('flex-shrink-0', activeSection === item.id ? 'text-green-700' : 'text-slate-400')}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {sidebarOpen && item.badge && item.badge > 0 && (
                  <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            </Tooltip>
          ))}
        </nav>

        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
            aria-label="Expand sidebar"
          >
            <ChevronLeft size={14} className={cn(isRTL ? '' : 'rotate-180')} />
          </button>
        )}

        {/* AI Assistant button at bottom */}
        <div className={cn('p-2 border-t border-slate-100 flex-shrink-0', !sidebarOpen && 'flex justify-center')}>
          <AIButton sidebarOpen={sidebarOpen} isRTL={isRTL} />
        </div>
      </aside>

      {/* Modern Mobile Bottom Navigation Bar */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-2 flex items-center justify-between shadow-lg overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Electric Flash Light Beam Effect on Close */}
        <AnimatePresence>
          {showFlash && (
            <>
              {/* Sweeping Light Beam */}
              <motion.div
                initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                animate={{ x: isRTL ? '-100%' : '100%', opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 via-white to-transparent shadow-[0_0_18px_#10b981,0_0_8px_#ffffff] z-50 pointer-events-none"
              />

              {/* Radial Flash Aura Burst */}
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-emerald-400/40 blur-md pointer-events-none z-50"
              />

              {/* Sparkle Icons Burst */}
              <motion.div
                initial={{ y: 0, opacity: 1, scale: 0.8 }}
                animate={{ y: -24, opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.45 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-500 z-50 pointer-events-none flex gap-3"
              >
                <Zap size={14} className="text-emerald-400 fill-emerald-400 animate-spin" />
                <Sparkles size={16} className="text-white fill-white" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {primaryMobileTabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleMobileNav(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all min-w-0 relative',
                isActive ? 'text-green-700 font-semibold bg-green-50' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Button */}
        <button
          onClick={() => {
            if (mobileMenuOpen) handleCloseMenu();
            else setMobileMenuOpen(true);
          }}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all min-w-0',
            mobileMenuOpen ? 'text-green-700 bg-green-50 font-semibold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Menu size={18} />
          <span className="text-[10px] leading-tight truncate max-w-full">{isRTL ? 'منو' : 'More'}</span>
        </button>
      </div>

      {/* Mobile Menu Sheet Drawer */}
      <AnimatePresence onExitComplete={triggerFlash}>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseMenu}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="md:hidden fixed bottom-14 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 p-4 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div className={cn('flex items-center justify-between pb-3 border-b border-slate-100', isRTL && 'flex-row-reverse')}>
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <div className="w-6 h-6 rounded-md bg-green-700 flex items-center justify-center text-white">
                    <Leaf size={13} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">{isRTL ? 'منوی فروشگاه' : 'Store Menu'}</span>
                </div>
                <button
                  onClick={handleCloseMenu}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2-Column Grid of All Sections */}
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNav(item.id)}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all text-right',
                      isRTL && 'flex-row-reverse text-right',
                      activeSection === item.id
                        ? 'bg-green-50 border-green-300 text-green-800 shadow-sm'
                        : 'bg-slate-50/60 border-slate-100 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span className={cn(activeSection === item.id ? 'text-green-700' : 'text-slate-500')}>
                      {item.icon}
                    </span>
                    <span className="truncate flex-1">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick AI Assistant Trigger */}
              <button
                onClick={() => {
                  handleCloseMenu();
                  setPanelOpen(true);
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-green-700 text-white font-medium text-xs shadow-md',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <Sparkles size={15} />
                <span>{isRTL ? 'چت با دستیار هوش مصنوعی Copilot' : 'Open AI Copilot Chat'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── AI Assistant Button ───────────────────────────────────────────────────────
function AIButton({ sidebarOpen, isRTL }: { sidebarOpen: boolean; isRTL: boolean }) {
  const { setPanelOpen, panelOpen } = useAIStore();
  const label = isRTL ? 'دستیار هوش مصنوعی' : 'AI Assistant';
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(true);
      setTimeout(() => setShimmer(false), 1400);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => setPanelOpen(!panelOpen)}
      title={label}
      className={cn(
        'relative overflow-hidden flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full',
        isRTL ? 'flex-row-reverse text-right' : 'text-left',
        panelOpen
          ? 'bg-green-700 text-white'
          : 'text-slate-600 hover:bg-green-50 hover:text-green-800 border border-dashed border-slate-200'
      )}
    >
      {/* 30s Electric Light Beam Sweeping Across Button */}
      <AnimatePresence>
        {shimmer && (
          <motion.div
            initial={{ x: isRTL ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: isRTL ? '-100%' : '100%', opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/50 via-white/80 to-transparent pointer-events-none z-10 shadow-[0_0_12px_#34d399]"
          />
        )}
      </AnimatePresence>

      <Sparkles size={15} className={cn('flex-shrink-0 relative z-20 transition-transform', panelOpen ? 'text-white' : 'text-green-600', shimmer && 'scale-125 text-emerald-500')} />
      {sidebarOpen && (
        <span className="truncate text-xs font-medium relative z-20">{label}</span>
      )}
    </button>
  );
}
