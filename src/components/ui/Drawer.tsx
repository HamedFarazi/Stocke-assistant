import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/stores/languageStore';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'right' | 'left';
  width?: string;
}

export function Drawer({ open, onClose, title, description, children, width = 'w-[480px]' }: DrawerProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';

  // In RTL, drawers open from the left; in LTR, from the right
  const side = isRTL ? 'left' : 'right';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={cn(
              'absolute top-0 h-full bg-white shadow-xl flex flex-col',
              side === 'right'
                ? 'right-0 border-l border-slate-200'
                : 'left-0 border-r border-slate-200',
              width, 'max-w-full'
            )}>
            <div className={cn('flex items-start justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0', isRTL && 'flex-row-reverse')}>
              <div className={cn(isRTL && 'text-right')}>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
              </div>
              <button onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
