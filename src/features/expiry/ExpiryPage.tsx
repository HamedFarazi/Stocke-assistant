import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { products } from '@/data/products';
import { getDaysUntilExpiry, cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertTriangle, CheckCircle2, Clock, Tag, ArrowRight } from 'lucide-react';
import type { ProductBatch, AttentionItem } from '@/types';
import { CreateOperationDialog } from '@/features/operations/CreateOperationDialog';

interface BatchWithProduct extends ProductBatch {
  productName: string;
  productUnit: string;
  productCategory: string;
}

export function ExpiryPage() {
  const { batches, updateBatch, addActivity } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate, formatDaysRemaining, formatNumber } = useLocale();
  const ex = t.expiry;

  const [createOpItem, setCreateOpItem] = useState<AttentionItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const batchesWithProduct = useMemo<BatchWithProduct[]>(() =>
    batches
      .filter(b => b.status === 'active' || b.status === 'expired')
      .map(b => {
        const p = products.find(pr => pr.id === b.productId);
        const name = p ? (isRTL && p.nameFa ? p.nameFa : p.name) : 'Unknown';
        return { ...b, productName: name, productUnit: p?.unit ?? '', productCategory: p?.category ?? '' };
      }),
    [batches, isRTL]
  );

  const grouped = useMemo(() => {
    const result: Record<string, BatchWithProduct[]> = { expired: [], today: [], '3days': [], '7days': [], '30days': [] };
    for (const b of batchesWithProduct) {
      const d = getDaysUntilExpiry(b.expiryDate);
      if (d < 0) result.expired.push(b);
      else if (d === 0) result.today.push(b);
      else if (d <= 3) result['3days'].push(b);
      else if (d <= 7) result['7days'].push(b);
      else if (d <= 30) result['30days'].push(b);
    }
    return result;
  }, [batchesWithProduct]);

  const totalAtRisk = useMemo(() => {
    return [...grouped.expired, ...grouped.today, ...grouped['3days'], ...grouped['7days']]
      .reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
  }, [grouped]);

  const urgentCount = grouped.expired.length + grouped.today.length + grouped['3days'].length;

  const expiryGroups = [
    { id: 'expired', label: ex.expiredGroup,    icon: <AlertTriangle size={14} />, cardClass: 'border-red-200 bg-red-50/40',     badgeVariant: 'danger'  as const, daysColor: 'text-red-600' },
    { id: 'today',   label: ex.todayGroup,      icon: <AlertTriangle size={14} />, cardClass: 'border-red-200 bg-orange-50/30',  badgeVariant: 'danger'  as const, daysColor: 'text-red-600' },
    { id: '3days',   label: ex.threeDaysGroup,  icon: <Clock size={14} />,         cardClass: 'border-orange-200 bg-orange-50/20',badgeVariant: 'warning' as const, daysColor: 'text-orange-600' },
    { id: '7days',   label: ex.sevenDaysGroup,  icon: <Clock size={14} />,         cardClass: 'border-amber-200 bg-amber-50/20', badgeVariant: 'warning' as const, daysColor: 'text-amber-600' },
    { id: '30days',  label: ex.thirtyDaysGroup, icon: <Clock size={14} />,         cardClass: 'border-blue-200 bg-blue-50/10',   badgeVariant: 'info'    as const, daysColor: 'text-blue-600' },
  ];

  async function handleMarkRemoved(batch: BatchWithProduct) {
    setActionLoading(batch.id);
    await new Promise(r => setTimeout(r, 350));
    updateBatch(batch.id, { status: 'removed', quantity: 0 });
    addActivity({
      type: 'product-marked-removed',
      title: isRTL ? `جمع‌آوری شد: ${batch.productName}` : `${batch.productName} marked as removed`,
      titleFa: `جمع‌آوری شد: ${batch.productName}`,
      description: isRTL ? `سری ${batch.batchCode} به علت انقضا/ضایعات از قفسه جمع‌آوری گردید.` : `Batch ${batch.batchCode} removed from shelf due to expiry/waste.`,
      descriptionFa: `سری ${batch.batchCode} به علت انقضا/ضایعات از قفسه جمع‌آوری گردید.`,
      actorId: 'user-001', actorName: isRTL ? 'سارا رضایی' : 'Sarah Mitchell',
      relatedEntityId: batch.productId, relatedEntityType: 'product', relatedEntityName: batch.productName,
    });
    setActionLoading(null);
  }

  async function handleMarkDiscounted(batch: BatchWithProduct) {
    setActionLoading(batch.id + '-d');
    await new Promise(r => setTimeout(r, 350));
    updateBatch(batch.id, { status: 'discounted' });
    addActivity({
      type: 'batch-discounted',
      title: `${batch.productName} ${ex.discountedActivity}`,
      description: `${isRTL ? 'دسته' : 'Batch'} ${batch.batchCode} ${ex.discountedDesc}`,
      actorId: 'user-001', actorName: 'Sarah Mitchell',
      relatedEntityId: batch.productId, relatedEntityType: 'product', relatedEntityName: batch.productName,
    });
    setActionLoading(null);
  }

  function getRecommendation(days: number): string {
    if (days < 0)  return ex.expiredRecommendation.replace('{{days}}', formatNumber(Math.abs(days)));
    if (days === 0) return ex.todayRecommendation;
    if (days <= 3)  return ex.threeDayRecommendation;
    if (days <= 7)  return ex.sevenDayRecommendation;
    return ex.thirtyDayRecommendation;
  }

  return (
    <div className="space-y-5">
      <div className={cn('flex items-start justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{ex.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{ex.subtitle}</p>
        </div>
        {urgentCount > 0 && (
          <Badge variant="danger" size="md" className="flex-shrink-0">
            {formatNumber(urgentCount)} {ex.urgentLabel}
          </Badge>
        )}
      </div>

      {/* Risk banner */}
      {totalAtRisk > 0 && (
        <div className={cn('bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3', isRTL && 'flex-row-reverse')}>
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className={cn(isRTL && 'text-right')}>
            <p className="text-sm font-semibold text-red-800">{formatCurrency(totalAtRisk)} {ex.riskBannerTitle}</p>
            <p className="text-xs text-red-600 mt-0.5">{ex.riskBannerDesc}</p>
          </div>
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {expiryGroups.map(g => {
          const count = grouped[g.id]?.length ?? 0;
          return (
            <div key={g.id} className={cn('rounded-lg border p-3 text-center', g.cardClass)}>
              <div className={cn('text-2xl font-bold', count > 0 ? g.daysColor : 'text-slate-400')}>{formatNumber(count)}</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">{g.label}</div>
            </div>
          );
        })}
      </div>

      {/* Groups */}
      {expiryGroups.map(g => {
        const items = grouped[g.id] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={g.id}>
            <div className={cn('flex items-center gap-2 mb-2.5', isRTL && 'flex-row-reverse')}>
              <span className={cn('flex items-center gap-1 text-xs font-semibold', g.daysColor, isRTL && 'flex-row-reverse')}>
                {g.icon} {g.label}
              </span>
              <Badge variant={g.badgeVariant} size="sm">{formatNumber(items.length)}</Badge>
            </div>
            <div className="space-y-2">
              {items.map(batch => {
                const days = getDaysUntilExpiry(batch.expiryDate);
                const value = batch.quantity * batch.sellingPrice;
                return (
                  <Card key={batch.id} padding="none" className={cn('border', g.cardClass)}>
                    <div className="px-4 py-3.5">
                      <div className={cn('flex flex-wrap items-start gap-3', isRTL && 'flex-row-reverse')}>
                        <div className="flex-1 min-w-0">
                          <div className={cn('flex flex-wrap items-center gap-2 mb-2', isRTL && 'flex-row-reverse')}>
                            <span className="text-sm font-semibold text-slate-900">{batch.productName}</span>
                            <span className="text-xs text-slate-400">{ex.batchLabel} {batch.batchCode}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                              {t.categories[batch.productCategory as keyof typeof t.categories] ?? batch.productCategory}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: t.common.quantity, value: `${formatNumber(batch.quantity)} ${batch.productUnit}`, color: 'text-slate-900' },
                              { label: ex.expiryDateCol, value: formatDate(batch.expiryDate), color: 'text-slate-700' },
                              { label: ex.statusCol, value: formatDaysRemaining(days), color: g.daysColor },
                              { label: ex.valuAtRisk, value: formatCurrency(value), color: 'text-slate-900' },
                            ].map(col => (
                              <div key={col.label} className={cn(isRTL && 'text-right')}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{col.label}</p>
                                <p className={cn('text-sm font-semibold', col.color)}>{col.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className={cn('mt-2 text-xs', isRTL && 'text-right')}>
                            <span className={cn(days < 0 || days === 0 ? 'text-red-600 font-medium' : days <= 3 ? 'text-orange-600' : days <= 7 ? 'text-amber-600' : 'text-slate-500')}>
                              {getRecommendation(days)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={cn('flex flex-col gap-1.5 flex-shrink-0 sm:flex-row sm:items-start', isRTL && 'flex-row-reverse')}>
                          <Button size="xs" variant="outline"
                            onClick={() => setCreateOpItem({
                              id: batch.id, severity: days < 0 ? 'critical' : 'high',
                              type: days < 0 ? 'expired' : 'expiring-soon',
                              productId: batch.productId, productName: batch.productName,
                              batchId: batch.id, quantity: batch.quantity, expiryDate: batch.expiryDate,
                              daysRemaining: days, estimatedValueAtRisk: value, recommendedAction: '', actionLabel: ex.createOperation,
                            })}>
                            <OperationIcon size={11} className="mx-1" />
                            {ex.createOperation}
                          </Button>
                          <Button size="xs" variant="outline" isLoading={actionLoading === batch.id + '-d'} onClick={() => handleMarkDiscounted(batch)}>
                            <Tag size={11} className="mx-1" />
                            {ex.markDiscounted}
                          </Button>
                          <Button size="xs" variant="danger" isLoading={actionLoading === batch.id} onClick={() => handleMarkRemoved(batch)}>
                            <ArrowRight size={11} className={cn('mx-1', isRTL && 'rotate-180')} />
                            {ex.markRemoved}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {Object.values(grouped).every(g => g.length === 0) && (
        <Card padding="lg">
          <EmptyState icon={<CheckCircle2 size={28} className="text-green-500" />} title={ex.allClearTitle} description={ex.allClearDesc} />
        </Card>
      )}

      <CreateOperationDialog open={!!createOpItem} onClose={() => setCreateOpItem(null)} prefilledItem={createOpItem} />
    </div>
  );
}

function OperationIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  );
}
