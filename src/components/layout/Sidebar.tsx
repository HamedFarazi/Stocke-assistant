import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAppStore } from '@/stores/appStore';
import { useAIStore } from '@/stores/aiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  LayoutDashboard, Package, AlertTriangle, ClipboardList,
  GitBranch, Activity, BarChart3, Settings, ChevronLeft,
  Leaf, Store, Sparkles, ShieldCheck, Brain,
} from 'lucide-react';
import { stores } from '@/data/stores';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onNavigate: (section: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { sidebarOpen, toggleSidebar, activeSection } = useUIStore();
  const { operations, notifications, currentStoreId } = useAppStore();
  const { t, isRTL } = useTranslation();
  const currentStore = stores.find(s => s.id === currentStoreId);

  const pendingOps = operations.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'overview',     label: t.nav.overview,    icon: <LayoutDashboard size={16} /> },
    { id: 'inventory',    label: t.nav.inventory,   icon: <Package size={16} /> },
    { id: 'expiry',       label: t.nav.expiry,      icon: <AlertTriangle size={16} /> },
    { id: 'operations',   label: t.nav.operations,  icon: <ClipboardList size={16} />, badge: pendingOps },
    { id: 'workflows',    label: t.nav.workflows,   icon: <GitBranch size={16} /> },
    { id: 'storehealth',  label: isRTL ? 'سلامت فروشگاه' : 'Store Health', icon: <ShieldCheck size={16} /> },
    { id: 'insights',     label: isRTL ? 'تحلیل AI'  : 'AI Insights',  icon: <Brain size={16} /> },
    { id: 'activity',     label: t.nav.activity,    icon: <Activity size={16} /> },
    { id: 'analytics',    label: t.nav.analytics,   icon: <BarChart3 size={16} /> },
    { id: 'settings',     label: t.nav.settings,    icon: <Settings size={16} /> },
  ];

  const chevronClass = cn('transition-transform', isRTL ? 'rotate-180' : '');

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
            <button
              key={item.id}
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

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-1 py-1 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
              activeSection === item.id ? 'text-green-700' : 'text-slate-500'
            )}
          >
            {item.icon}
            <span className="text-[10px]">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => onNavigate('settings')}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
            activeSection === 'settings' ? 'text-green-700' : 'text-slate-500'
          )}
        >
          <Settings size={16} />
          <span className="text-[10px]">{t.nav.settings.split(' ')[0]}</span>
        </button>
      </div>
    </>
  );
}

// ── AI Assistant Button ───────────────────────────────────────────────────────
function AIButton({ sidebarOpen, isRTL }: { sidebarOpen: boolean; isRTL: boolean }) {
  const { setPanelOpen, panelOpen } = useAIStore();
  const label = isRTL ? 'دستیار هوش مصنوعی' : 'AI Assistant';

  return (
    <button
      onClick={() => setPanelOpen(!panelOpen)}
      title={label}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full',
        isRTL ? 'flex-row-reverse text-right' : 'text-left',
        panelOpen
          ? 'bg-green-700 text-white'
          : 'text-slate-600 hover:bg-green-50 hover:text-green-800 border border-dashed border-slate-200'
      )}
    >
      <Sparkles size={15} className={cn('flex-shrink-0', panelOpen ? 'text-white' : 'text-green-600')} />
      {sidebarOpen && (
        <span className="truncate text-xs font-medium">{label}</span>
      )}
    </button>
  );
}
