import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 text-center px-4', className)}>
      {icon && (
        <div className="mb-3 p-3 rounded-full bg-slate-100 text-slate-400">{icon}</div>
      )}
      <h3 className={cn('text-sm font-medium text-slate-700', isRTL && 'font-persian')}>{title}</h3>
      {description && (
        <p className={cn('text-sm text-slate-500 mt-1 max-w-xs', isRTL && 'font-persian')}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
