import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportMenuProps {
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onPrint?: () => void;
  size?: 'sm' | 'xs';
  className?: string;
}

export function ExportMenu({ onExportCSV, onExportJSON, onPrint, size = 'sm', className }: ExportMenuProps) {
  const { isRTL } = useTranslation();
  const isFa = isRTL;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    onExportCSV  && { label: isFa ? 'دانلود CSV'  : 'Download CSV',  icon: <Table2 size={13} />,   action: onExportCSV },
    onExportJSON && { label: isFa ? 'دانلود JSON' : 'Download JSON', icon: <FileText size={13} />, action: onExportJSON },
    onPrint      && { label: isFa ? 'چاپ / PDF'   : 'Print / PDF',   icon: <Printer size={13} />,  action: onPrint },
  ].filter(Boolean) as { label: string; icon: React.ReactNode; action: () => void }[];

  if (options.length === 0) return null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-md border border-slate-200 bg-white text-slate-600',
          'hover:bg-slate-50 hover:border-slate-300 transition-colors',
          size === 'xs' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
          isRTL && 'flex-row-reverse'
        )}
      >
        <Download size={size === 'xs' ? 11 : 13} />
        {isFa ? 'خروجی' : 'Export'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute top-9 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[150px]',
              isRTL ? 'left-0' : 'right-0'
            )}
          >
            {options.map(opt => (
              <button key={opt.label}
                onClick={() => { opt.action(); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors',
                  isRTL && 'flex-row-reverse text-right'
                )}
              >
                <span className="text-slate-400">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
