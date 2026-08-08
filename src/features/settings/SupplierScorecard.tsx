import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Truck, Star, TrendingUp, Package, AlertTriangle, Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

// Simulated supplier scores — in production these come from delivery/batch data
const SUPPLIER_SCORES: Record<string, {
  delivery: number; avgExpiry: number; quality: number; delay: number; waste: number;
}> = {
  'sup-001': { delivery: 94, avgExpiry: 88, quality: 92, delay: 6, waste: 8 },
  'sup-002': { delivery: 78, avgExpiry: 72, quality: 80, delay: 22, waste: 15 },
  'sup-003': { delivery: 96, avgExpiry: 91, quality: 95, delay: 4, waste: 5 },
  'sup-004': { delivery: 85, avgExpiry: 80, quality: 88, delay: 15, waste: 11 },
  'sup-005': { delivery: 91, avgExpiry: 86, quality: 90, delay: 9, waste: 9 },
  'sup-006': { delivery: 88, avgExpiry: 83, quality: 87, delay: 12, waste: 12 },
};

function overall(s: { delivery: number; avgExpiry: number; quality: number; delay: number; waste: number }) {
  return Math.round((s.delivery * 0.3 + s.avgExpiry * 0.25 + s.quality * 0.25 + (100 - s.delay) * 0.1 + (100 - s.waste) * 0.1));
}

function ScoreMini({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={cn('text-base font-bold', color)}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
      <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
        <motion.div className={cn('h-full rounded-full', value >= 85 ? 'bg-green-500' : value >= 70 ? 'bg-amber-400' : 'bg-red-400')}
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

interface SupplierScorecardProps {
  openAddSup: () => void;
  openEditSup: (su: import('@/types').Supplier) => void;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
}

export function SupplierScorecard({ openAddSup, openEditSup, t, isRTL }: SupplierScorecardProps) {
  const { suppliers } = useSettingsStore();
  const { formatNumber } = useLocale();
  const isFa = isRTL;

  const labels = {
    title:     isFa ? 'کارنامه تأمین‌کنندگان' : 'Supplier Scorecards',
    delivery:  isFa ? 'تحویل' : 'Delivery',
    expiry:    isFa ? 'انقضا' : 'Avg Expiry',
    quality:   isFa ? 'کیفیت' : 'Quality',
    delay:     isFa ? 'تأخیر' : 'Delay %',
    waste:     isFa ? 'اتلاف' : 'Waste %',
    overall:   isFa ? 'کلی' : 'Overall',
    excellent: isFa ? 'عالی' : 'Excellent',
    good:      isFa ? 'خوب' : 'Good',
    poor:      isFa ? 'ضعیف' : 'Poor',
    addBtn:    t.common.addSupplier,
  };

  return (
    <Card padding="lg">
      <div className={cn('flex items-center justify-between mb-4', isRTL && 'flex-row-reverse')}>
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
        <Button size="sm" leftIcon={<Plus size={13} />} onClick={openAddSup}>{labels.addBtn}</Button>
      </div>

      <div className="space-y-3">
        {suppliers.map((sup, idx) => {
          const sc = SUPPLIER_SCORES[sup.id] ?? { delivery: 80, avgExpiry: 78, quality: 82, delay: 10, waste: 10 };
          const ov = overall(sc);
          const ovColor = ov >= 85 ? 'text-green-700' : ov >= 70 ? 'text-amber-600' : 'text-red-600';
          const ovBadge: 'success'|'warning'|'danger' = ov >= 85 ? 'success' : ov >= 70 ? 'warning' : 'danger';
          const ovLabel = ov >= 85 ? labels.excellent : ov >= 70 ? labels.good : labels.poor;

          return (
            <motion.div key={sup.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-colors">
              <div className={cn('flex items-start justify-between gap-3 mb-3', isRTL && 'flex-row-reverse')}>
                <div className={cn('flex items-center gap-2.5', isRTL && 'flex-row-reverse')}>
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Truck size={15} className="text-slate-500" />
                  </div>
                  <div className={cn(isRTL && 'text-right')}>
                    <p className="text-sm font-semibold text-slate-900">{isFa && sup.nameFa ? sup.nameFa : sup.name}</p>
                    <p className="text-xs text-slate-500">{t.categories[sup.category as keyof typeof t.categories] ?? sup.category}</p>
                  </div>
                </div>
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <Badge variant={ovBadge} size="sm">{ovLabel}</Badge>
                  <div className={cn('flex items-center gap-1', ovColor)}>
                    <Star size={13} className="fill-current" />
                    <span className="text-sm font-bold">{formatNumber(ov)}</span>
                  </div>
                  <button onClick={() => openEditSup(sup)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Pencil size={12} />
                  </button>
                </div>
              </div>

              {/* Score metrics */}
              <div className="grid grid-cols-5 gap-2">
                <ScoreMini value={sc.delivery} label={labels.delivery}
                  color={sc.delivery >= 85 ? 'text-green-700' : sc.delivery >= 70 ? 'text-amber-600' : 'text-red-600'} />
                <ScoreMini value={sc.avgExpiry} label={labels.expiry}
                  color={sc.avgExpiry >= 85 ? 'text-green-700' : sc.avgExpiry >= 70 ? 'text-amber-600' : 'text-red-600'} />
                <ScoreMini value={sc.quality} label={labels.quality}
                  color={sc.quality >= 85 ? 'text-green-700' : sc.quality >= 70 ? 'text-amber-600' : 'text-red-600'} />
                <ScoreMini value={sc.delay} label={labels.delay}
                  color={sc.delay <= 10 ? 'text-green-700' : sc.delay <= 20 ? 'text-amber-600' : 'text-red-600'} />
                <ScoreMini value={sc.waste} label={labels.waste}
                  color={sc.waste <= 10 ? 'text-green-700' : sc.waste <= 15 ? 'text-amber-600' : 'text-red-600'} />
              </div>
            </motion.div>
          );
        })}

        {suppliers.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <Package size={24} className="mx-auto mb-2 text-slate-300" />
            {isFa ? 'هیچ تأمین‌کننده‌ای ثبت نشده.' : 'No suppliers added yet.'}
          </div>
        )}
      </div>
    </Card>
  );
}
