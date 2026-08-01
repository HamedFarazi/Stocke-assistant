import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useLanguageStore } from '@/stores/languageStore';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, id, dir, ...props }, ref) => {
    const { language } = useLanguageStore();
    const isRTL = language === 'fa';
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    // number/date fields always LTR internally
    const isNumeric = props.type === 'number' || props.type === 'date';
    const inputDir = dir ?? (isNumeric ? 'ltr' : isRTL ? 'rtl' : 'ltr');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={cn('text-sm font-medium text-slate-700', isRTL && 'text-right block')}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && !isRTL && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{leftIcon}</div>
          )}
          {leftIcon && isRTL && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            dir={inputDir}
            className={cn(
              'w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && !isRTL && 'pl-9',
              leftIcon && isRTL  && 'pr-9',
              rightIcon && !isRTL && 'pr-9',
              rightIcon && isRTL  && 'pl-9',
              isRTL && !isNumeric && 'text-right',
              error && 'border-red-400 focus:ring-red-400',
              className
            )}
            {...props}
          />
          {rightIcon && !isRTL && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</div>
          )}
          {rightIcon && isRTL && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</div>
          )}
        </div>
        {error && <p className={cn('text-xs text-red-600', isRTL && 'text-right')}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, id, dir, ...props }, ref) => {
    const { language } = useLanguageStore();
    const isRTL = language === 'fa';
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const selectDir = dir ?? (isRTL ? 'rtl' : 'ltr');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className={cn('text-sm font-medium text-slate-700', isRTL && 'text-right block')}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          dir={selectDir}
          className={cn(
            'w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent',
            'disabled:opacity-50',
            isRTL && 'text-right',
            error && 'border-red-400',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className={cn('text-xs text-red-600', isRTL && 'text-right')}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const { language } = useLanguageStore();
    const isRTL = language === 'fa';
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className={cn('text-sm font-medium text-slate-700', isRTL && 'text-right block')}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={cn(
            'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent',
            isRTL && 'text-right',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {error && <p className={cn('text-xs text-red-600', isRTL && 'text-right')}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
