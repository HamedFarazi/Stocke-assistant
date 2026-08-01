import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  urgent?: boolean;
  trend?: { value: number; label: string };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label, value, subtext, icon, iconBg = 'bg-slate-100', iconColor = 'text-slate-500',
  urgent, trend, onClick, className,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -1 } : undefined}
      className={cn(
        'bg-white border border-slate-200 rounded-lg p-4 relative overflow-hidden',
        urgent && 'ring-1 ring-red-200 border-red-100',
        onClick && 'cursor-pointer hover:shadow-sm transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {urgent && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      {icon && (
        <div className={cn('inline-flex p-1.5 rounded-md mb-2.5', iconBg, iconColor)}>
          {icon}
        </div>
      )}
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
      {subtext && <div className="text-[11px] text-slate-400 mt-0.5">{subtext}</div>}
      {trend && (
        <div className={cn('flex items-center gap-0.5 text-[11px] mt-1 font-medium',
          trend.value >= 0 ? 'text-green-600' : 'text-red-500'
        )}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </motion.div>
  );
}
