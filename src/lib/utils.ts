import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, parseISO } from 'date-fns';
import type { RiskLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Static currency helpers (English only) ──────────────────────────────────
// Use useCurrency() hook in components for language-aware formatting.

export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) return `£${(amount / 1000).toFixed(1)}k`;
  return `£${amount.toFixed(2)}`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function getDaysUntilExpiry(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date());
}

// Static English-only formatter — use useLocale().formatDaysRemaining in components.
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

// ── Risk ─────────────────────────────────────────────────────────────────────

export function getRiskLevel(daysUntilExpiry: number | null, quantity: number): RiskLevel {
  if (daysUntilExpiry === null) return 'normal';
  if (daysUntilExpiry < 0)  return 'critical';
  if (daysUntilExpiry === 0) return 'critical';
  if (daysUntilExpiry <= 2) return 'critical';
  if (daysUntilExpiry <= 5) return 'urgent';
  if (daysUntilExpiry <= 14) return 'attention';
  if (quantity === 0) return 'attention';
  return 'normal';
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'critical':  return 'text-red-600';
    case 'urgent':    return 'text-orange-500';
    case 'attention': return 'text-amber-500';
    default:          return 'text-green-600';
  }
}

export function getRiskBgColor(risk: RiskLevel): string {
  switch (risk) {
    case 'critical':  return 'bg-red-50 text-red-700 border-red-200';
    case 'urgent':    return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'attention': return 'bg-amber-50 text-amber-700 border-amber-200';
    default:          return 'bg-green-50 text-green-700 border-green-200';
  }
}

// ── Status / Priority colors ─────────────────────────────────────────────────

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-50 text-red-700 border-red-200';
    case 'high':     return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'medium':   return 'bg-amber-50 text-amber-700 border-amber-200';
    default:         return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':     return 'bg-slate-100 text-slate-700';
    case 'in-progress': return 'bg-blue-50 text-blue-700';
    case 'completed':   return 'bg-green-50 text-green-700';
    case 'dismissed':   return 'bg-slate-50 text-slate-400';
    case 'active':      return 'bg-green-50 text-green-700';
    case 'inactive':    return 'bg-slate-100 text-slate-600';
    case 'draft':       return 'bg-amber-50 text-amber-700';
    default:            return 'bg-slate-100 text-slate-600';
  }
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
