import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, ClipboardList, GitBranch, LayoutDashboard, AlertTriangle, BarChart3, Activity, Settings, ArrowRight, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { products } from '@/data/products';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  type: 'page' | 'product' | 'operation' | 'workflow' | 'action';
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

const PAGES_EN = [
  { id: 'overview',  label: 'Overview',      icon: <LayoutDashboard size={14} />, section: 'overview' },
  { id: 'inventory', label: 'Inventory',      icon: <Package size={14} />,         section: 'inventory' },
  { id: 'expiry',    label: 'Expiry Centre',  icon: <AlertTriangle size={14} />,   section: 'expiry' },
  { id: 'operations',label: 'Operations',     icon: <ClipboardList size={14} />,   section: 'operations' },
  { id: 'workflows', label: 'Workflows',      icon: <GitBranch size={14} />,       section: 'workflows' },
  { id: 'analytics', label: 'Analytics',      icon: <BarChart3 size={14} />,       section: 'analytics' },
  { id: 'activity',  label: 'Activity',       icon: <Activity size={14} />,        section: 'activity' },
  { id: 'settings',  label: 'Settings',       icon: <Settings size={14} />,        section: 'settings' },
];
const PAGES_FA = [
  { id: 'overview',  label: 'نمای کلی',      icon: <LayoutDashboard size={14} />, section: 'overview' },
  { id: 'inventory', label: 'موجودی',        icon: <Package size={14} />,         section: 'inventory' },
  { id: 'expiry',    label: 'مرکز انقضا',   icon: <AlertTriangle size={14} />,   section: 'expiry' },
  { id: 'operations',label: 'عملیات‌ها',    icon: <ClipboardList size={14} />,   section: 'operations' },
  { id: 'workflows', label: 'گردش‌کارها',   icon: <GitBranch size={14} />,       section: 'workflows' },
  { id: 'analytics', label: 'تحلیل‌ها',     icon: <BarChart3 size={14} />,       section: 'analytics' },
  { id: 'activity',  label: 'فعالیت‌ها',    icon: <Activity size={14} />,        section: 'activity' },
  { id: 'settings',  label: 'تنظیمات',      icon: <Settings size={14} />,        section: 'settings' },
];

export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const { operations, workflows } = useAppStore();
  const { t, isRTL } = useTranslation();
  const isFa = isRTL;

  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const pages = isFa ? PAGES_FA : PAGES_EN;

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Pages
    pages.forEach(p => {
      items.push({
        id: `page-${p.id}`,
        type: 'page',
        label: p.label,
        sublabel: isFa ? 'صفحه' : 'Page',
        icon: p.icon,
        action: () => { onNavigate(p.section); setRecentPages(r => [p.section, ...r.filter(x => x !== p.section)].slice(0, 3)); onClose(); },
        keywords: [p.label.toLowerCase(), p.section],
      });
    });

    // Products
    products.forEach(p => {
      items.push({
        id: `product-${p.id}`,
        type: 'product',
        label: p.name,
        sublabel: `${p.sku} · ${p.category}`,
        icon: <Package size={14} className="text-blue-500" />,
        action: () => { onNavigate('inventory'); onClose(); },
        keywords: [p.name.toLowerCase(), p.sku.toLowerCase(), p.category.toLowerCase()],
      });
    });

    // Operations (open only)
    operations.filter(o => o.status === 'pending' || o.status === 'in-progress').slice(0, 8).forEach(o => {
      items.push({
        id: `op-${o.id}`,
        type: 'operation',
        label: o.title,
        sublabel: isFa ? `عملیات · ${o.priority}` : `Operation · ${o.priority}`,
        icon: <ClipboardList size={14} className="text-amber-500" />,
        action: () => { onNavigate('operations'); onClose(); },
        keywords: [o.title.toLowerCase(), o.type, o.priority],
      });
    });

    // Workflows
    workflows.slice(0, 6).forEach(w => {
      items.push({
        id: `wf-${w.id}`,
        type: 'workflow',
        label: w.name,
        sublabel: isFa ? `گردش‌کار · ${w.status}` : `Workflow · ${w.status}`,
        icon: <GitBranch size={14} className="text-green-600" />,
        action: () => { onNavigate('workflows'); onClose(); },
        keywords: [w.name.toLowerCase(), w.status],
      });
    });

    return items;
  }, [pages, operations, workflows, isFa, onNavigate, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.filter(i => i.type === 'page');
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.sublabel ?? '').toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    ).slice(0, 12);
  }, [query, allItems]);

  // Keyboard navigation
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action(); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIdx]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const typeColor: Record<string, string> = {
    page: 'bg-slate-100 text-slate-600',
    product: 'bg-blue-50 text-blue-600',
    operation: 'bg-amber-50 text-amber-600',
    workflow: 'bg-green-50 text-green-700',
    action: 'bg-purple-50 text-purple-600',
  };
  const typeLabel: Record<string, string> = {
    page:      isFa ? 'صفحه'      : 'Page',
    product:   isFa ? 'محصول'     : 'Product',
    operation: isFa ? 'عملیات'    : 'Operation',
    workflow:  isFa ? 'گردش‌کار'  : 'Workflow',
    action:    isFa ? 'اقدام'     : 'Action',
  };

  const placeholder = isFa ? 'جستجوی صفحه، محصول، عملیات…' : 'Search pages, products, operations…';
  const hint = isFa ? 'جستجو کنید یا انتخاب کنید' : 'Search or select';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.12 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Search input */}
            <div className={cn('flex items-center gap-3 px-4 py-3.5 border-b border-slate-100', isRTL && 'flex-row-reverse')}>
              <Search size={16} className="text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
                placeholder={placeholder}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 font-mono">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-400">{isFa ? 'نتیجه‌ای یافت نشد' : 'No results found'}</p>
                </div>
              ) : (
                <div className="py-1.5">
                  {!query && (
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {hint}
                    </p>
                  )}
                  {filtered.map((item, idx) => (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                        isRTL && 'flex-row-reverse text-right',
                        idx === selectedIdx ? 'bg-green-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
                        typeColor[item.type] ?? 'bg-slate-100 text-slate-500'
                      )}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-slate-400 truncate">{item.sublabel}</p>
                        )}
                      </div>
                      <div className={cn('flex items-center gap-1.5 flex-shrink-0', isRTL && 'flex-row-reverse')}>
                        <span className={cn('text-[10px] rounded px-1.5 py-0.5 font-medium', typeColor[item.type])}>
                          {typeLabel[item.type]}
                        </span>
                        {idx === selectedIdx && <ArrowRight size={12} className={cn('text-green-600', isRTL && 'rotate-180')} />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn('flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50', isRTL && 'flex-row-reverse')}>
              <div className={cn('flex items-center gap-3 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
                <span className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  <kbd className="bg-slate-200 rounded px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                  {isFa ? 'انتقال' : 'Navigate'}
                </span>
                <span className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  <kbd className="bg-slate-200 rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                  {isFa ? 'انتخاب' : 'Select'}
                </span>
              </div>
              <span className="text-[11px] text-slate-300">
                {isFa ? 'Ctrl+K برای بستن' : 'Ctrl+K to close'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
