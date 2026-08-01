import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/types';
import { Plus, ArrowUpDown, Package } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';

interface ProductDetailDrawerProps {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
  onAddBatch: (productId: string) => void;
}

export function ProductDetailDrawer({ item, open, onClose, onAddBatch }: ProductDetailDrawerProps) {
  const { operations, workflows } = useAppStore();
  const { suppliers } = useSettingsStore();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate, formatDaysRemaining, formatNumber, getDaysUntilExpiry } = useLocale();
  const inv = t.inventory;

  const supplier = suppliers.find(s => s.id === item.product.supplierId);
  const relatedOps = operations.filter(o => o.productId === item.product.id && (o.status === 'pending' || o.status === 'in-progress'));
  const activeWorkflows = workflows.filter(w => w.status === 'active');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item.product.name}
      description={`${item.product.sku} · ${t.categories[item.product.category as keyof typeof t.categories] ?? item.product.category}`}
      width="w-[520px]"
    >
      <div className={cn('p-5 space-y-5', isRTL && 'text-right')}>
        {/* Product info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.common.type,     value: item.product.unit },
            { label: t.common.value,    value: formatCurrency(item.product.sellingPrice) },
            { label: t.common.location, value: item.product.storageLocation },
            { label: t.common.supplier, value: supplier?.name ?? '—' },
            { label: isRTL ? 'حداقل موجودی' : 'Min Stock', value: `${formatNumber(item.product.minStockLevel)} ${t.common.units}` },
            { label: isRTL ? 'حداکثر موجودی' : 'Max Stock', value: `${formatNumber(item.product.maxStockLevel)} ${t.common.units}` },
          ].map(({ label, value }) => (
            <div key={label} className={cn('bg-slate-50 rounded-md p-2.5', isRTL && 'text-right')}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* FEFO recommendation */}
        {item.batches.length > 1 && (
          <div className={cn('bg-green-50 border border-green-200 rounded-lg p-3', isRTL && 'text-right')}>
            <div className={cn('flex items-center gap-2 mb-1', isRTL && 'flex-row-reverse')}>
              <ArrowUpDown size={14} className="text-green-700" />
              <span className="text-xs font-semibold text-green-800">{inv.fefoTitle}</span>
            </div>
            <p className="text-xs text-green-700">
              {inv.fefoDesc} <strong>{item.batches[0]?.batchCode}</strong> {inv.fefoDesc2}
              {' '}({formatDaysRemaining(getDaysUntilExpiry(item.batches[0]?.expiryDate ?? ''))}).
            </p>
          </div>
        )}

        {/* Batches */}
        <div>
          <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
            <h3 className="text-sm font-semibold text-slate-900">
              {isRTL ? 'دسته‌ها' : 'Batches'} ({formatNumber(item.batches.length)})
            </h3>
            <Button size="xs" variant="outline" leftIcon={<Plus size={11} />} onClick={() => onAddBatch(item.product.id)}>
              {inv.addBatchBtn}
            </Button>
          </div>
          <div className="space-y-2">
            {item.batches.map((batch) => {
              const days = getDaysUntilExpiry(batch.expiryDate);
              const riskColor = days < 0 ? 'border-red-200 bg-red-50/50' : days <= 3 ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 bg-white';
              return (
                <div key={batch.id} className={cn('border rounded-lg p-3', riskColor)}>
                  <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                      <span className="text-xs font-semibold text-slate-800">{batch.batchCode}</span>
                      <Badge variant={batch.status === 'expired' ? 'danger' : batch.status === 'discounted' ? 'warning' : 'default'} size="sm">
                        {batch.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatNumber(batch.quantity)} {t.common.units}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-slate-500">
                    <div className={cn(isRTL && 'text-right')}>
                      <p className="text-[10px] text-slate-400">{t.expiry.expiryDateCol}</p>
                      <p className="font-medium text-slate-700">{formatDate(batch.expiryDate)}</p>
                    </div>
                    <div className={cn(isRTL && 'text-right')}>
                      <p className="text-[10px] text-slate-400">{isRTL ? 'روز باقی‌مانده' : 'Days Left'}</p>
                      <p className={cn('font-medium', days < 0 ? 'text-red-600' : days <= 3 ? 'text-orange-600' : 'text-slate-700')}>
                        {formatDaysRemaining(days)}
                      </p>
                    </div>
                    <div className={cn(isRTL && 'text-right')}>
                      <p className="text-[10px] text-slate-400">{t.common.value}</p>
                      <p className="font-medium text-slate-700">{formatCurrency(batch.quantity * batch.sellingPrice)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {item.batches.length === 0 && (
              <div className="text-center py-6 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <Package size={20} className="mx-auto mb-1 text-slate-300" />
                {isRTL ? 'دسته‌ای ثبت نشده' : 'No batches recorded'}
              </div>
            )}
          </div>
        </div>

        {/* Open Operations */}
        {relatedOps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {inv.openOperations} ({formatNumber(relatedOps.length)})
            </h3>
            <div className="space-y-1.5">
              {relatedOps.map(op => (
                <div key={op.id} className={cn('flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-md', isRTL && 'flex-row-reverse')}>
                  <span className="text-xs font-medium text-amber-900 truncate">{op.title}</span>
                  <Badge variant={op.priority === 'critical' ? 'danger' : 'warning'} size="sm">
                    {t.operations[op.priority as keyof typeof t.operations] as string ?? op.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring Workflows */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">{inv.monitoringWorkflows}</h3>
          <div className="space-y-1.5">
            {activeWorkflows.slice(0, 3).map(wf => (
              <div key={wf.id} className={cn('flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md', isRTL && 'flex-row-reverse')}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-slate-700">{wf.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
