import { Bell, Search, User, ChevronDown, Menu, Command, X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useDemoStore } from '@/stores/demoStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { stores } from '@/data/stores';
import { DEMO_STORE } from '@/data/demoData';

interface HeaderProps {
  onNavigate: (section: string) => void;
  onOpenCommand?: () => void;
}

export function Header({ onNavigate, onOpenCommand }: HeaderProps) {
  const { notifications, currentStoreId, setCurrentStore } = useAppStore();
  const { activeSection, toggleSidebar } = useUIStore();
  const { t, isRTL } = useTranslation();
  const { isDemoMode, exitDemo } = useDemoStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isFa = isRTL;

  // Merge demo store into available stores
  const allStores = isDemoMode
    ? [DEMO_STORE, ...stores.filter(s => s.id !== 'demo-store')]
    : stores;
  const currentStore = allStores.find(s => s.id === currentStoreId) ?? allStores[0];

  const breadcrumbMap: Record<string, string> = {
    overview: t.nav.overview, inventory: t.nav.inventory, expiry: t.nav.expiry,
    operations: t.nav.operations, workflows: t.nav.workflows, activity: t.nav.activity,
    analytics: t.nav.analytics, settings: t.nav.settings,
    storehealth: isFa ? 'سلامت فروشگاه' : 'Store Health',
    insights: isFa ? 'بینش‌های AI' : 'AI Insights',
  };

  function handleExitDemo() {
    exitDemo();
    window.location.reload();
  }

  return (
    <header className={cn(
      'h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 z-30 relative',
      isRTL && 'flex-row-reverse'
    )}>
      {/* Menu toggle (mobile) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className={cn('hidden md:flex items-center gap-1.5 text-sm text-slate-500 flex-shrink-0', isRTL && 'flex-row-reverse')}>
        <span className="font-semibold text-slate-900">FreshFlow</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700">{breadcrumbMap[activeSection] ?? activeSection}</span>
      </div>

      {/* Demo badge — compact badge */}
      {isDemoMode && (
        <div className={cn('flex items-center gap-2 flex-shrink-0', isRTL && 'flex-row-reverse')}>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 rounded-full px-2.5 py-0.5 text-xs font-semibold text-amber-700 shadow-sm">
            <Sparkles size={11} className="text-amber-500" />
            <span>{isFa ? 'حالت دمو' : 'Demo Mode'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <button
            onClick={handleExitDemo}
            className="flex items-center gap-1 h-6 px-2 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
          >
            <X size={10} /> {isFa ? 'خروج' : 'Exit'}
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex-1 max-w-sm mx-2 hidden sm:block">
        <button
          onClick={onOpenCommand}
          className={cn(
            'w-full h-8 flex items-center gap-2 px-3 text-sm text-slate-400',
            'bg-slate-50 border border-slate-200 rounded-md hover:bg-white hover:border-slate-300',
            'transition-colors cursor-pointer',
            isRTL && 'flex-row-reverse'
          )}
        >
          <Search size={13} className="flex-shrink-0" />
          <span className="flex-1 text-left truncate">{isFa ? 'جستجو…' : 'Search…'}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-slate-300 bg-slate-100 rounded px-1.5 py-0.5 font-mono flex-shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className={cn('flex items-center gap-1.5 flex-shrink-0', isRTL ? 'mr-auto' : 'ml-auto')}>
        {/* Search icon on mobile */}
        {!isDemoMode && (
          <button onClick={onOpenCommand} className="sm:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100">
            <Search size={16} />
          </button>
        )}

        {/* Store selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setStoreMenuOpen(!storeMenuOpen)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-700',
              'bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors',
              isRTL && 'flex-row-reverse'
            )}
          >
            <span className="max-w-[140px] truncate">{isFa && currentStore?.nameFa ? currentStore.nameFa : currentStore?.name ?? 'Store'}</span>
            <ChevronDown size={12} />
          </button>
          {storeMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStoreMenuOpen(false)} />
              <div className={cn('absolute top-9 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[200px]', isRTL ? 'left-0' : 'right-0')}>
                {allStores.map(store => (
                  <button key={store.id}
                    onClick={() => { setCurrentStore(store.id); setStoreMenuOpen(false); }}
                    className={cn('w-full px-3 py-2 text-xs hover:bg-slate-50 transition-colors', isRTL ? 'text-right' : 'text-left', store.id === currentStoreId ? 'text-green-700 font-medium' : 'text-slate-700')}>
                    {isFa && store.nameFa ? store.nameFa : store.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => onNavigate('settings')}
          className={cn('flex items-center gap-2 h-8 px-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors', isRTL && 'flex-row-reverse')}
        >
          <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-white" />
          </div>
          <span className="hidden sm:block text-xs font-medium">
            {isFa ? 'سارا رضایی' : (isDemoMode ? 'Emma W.' : 'Sarah M.')}
          </span>
        </button>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onNavigate={onNavigate} />
    </header>
  );
}
