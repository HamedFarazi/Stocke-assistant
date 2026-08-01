import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/stores/languageStore';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function Dialog({ open, onClose, title, description, children, size = 'md', className }: DialogProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn('relative z-10 w-full bg-white rounded-xl shadow-xl border border-slate-200', sizeClasses[size], className)}
            role="dialog" aria-modal="true" aria-labelledby="dialog-title"
            dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={cn('flex items-start justify-between p-5 border-b border-slate-100', isRTL && 'flex-row-reverse')}>
              <div className={cn(isRTL && 'text-right')}>
                <h2 id="dialog-title" className="text-base font-semibold text-slate-900">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
              </div>
              <button onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
