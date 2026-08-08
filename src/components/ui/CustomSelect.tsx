import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  label?: string;
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'انتخاب کنید…',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className={cn('text-[11px] font-semibold text-slate-600 block', isRTL && 'text-right')}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full h-9 rounded-xl border bg-white px-3 text-xs font-medium text-slate-800 transition-all flex items-center justify-between gap-2 shadow-sm',
            open
              ? 'border-green-600 ring-2 ring-green-600/20 shadow-md'
              : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50',
            disabled && 'opacity-50 cursor-not-allowed',
            isRTL && 'flex-row-reverse text-right',
            className
          )}
        >
          <span className="truncate flex items-center gap-2">
            {selectedOption?.icon}
            <span>{selectedOption ? selectedOption.label : placeholder}</span>
          </span>
          <ChevronDown
            size={14}
            className={cn('text-slate-400 transition-transform duration-200 flex-shrink-0', open && 'rotate-180 text-green-700')}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute top-10 z-50 w-full min-w-[200px] max-h-60 overflow-y-auto rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1.5 space-y-0.5 text-xs',
                isRTL ? 'right-0 text-right' : 'left-0 text-left'
              )}
            >
              {options.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-medium transition-all group',
                      isRTL && 'flex-row-reverse text-right',
                      isSelected
                        ? 'bg-green-50 text-green-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && (
                      <Check size={13} className="text-green-700 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
