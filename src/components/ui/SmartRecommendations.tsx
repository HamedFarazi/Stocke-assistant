import { useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn, getDaysUntilExpiry } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { Lightbulb, Tag, Package, TrendingUp, Truck, ChevronRight } from 'lucide-react';

interface Rec {
  id: string;
  icon: React.ReactNode;
  text: string;
  actionLabel: string;
  color: string;
}

interface SmartRecommendationsProps {
  onNavigate?: (section: string) => void;
  maxItems?: number;
}

export function SmartRecommendations({ onNavigate, maxItems = 3 }: SmartRecommendationsProps) {
  const { batches } = useAppStore();
  const { inventoryItems } = useInventory();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatNumber } = useLocale();
  const isFa = isRTL;

  const recommendations = useMemo<Rec[]>(() => {
    const recs: Rec[] = [];

    // 1. Discount recommendations for expiring batches
    const expiring3 = batches.filter(b => {
      const d = getDaysUntilExpiry(b.expiryDate);
      return b.status === 'active' && d >= 0 && d <= 3;
    });
    if (expiring3.length > 0) {
      const value = expiring3.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
      recs.push({
        id: 'discount-expiring',
        icon: <Tag size={14} className="text-orange-500" />,
        text: isFa
          ? `${formatNumber(expiring3.length)} دسته در ۳ روز آینده منقضی می‌شود. اعمال ۲۰–۳۰٪ تخفیف را بررسی کنید (${formatCurrency(value)} در معرض خطر).`
          : `${expiring3.length} batch(es) expire in 3 days. Consider a 20–30% discount (${formatCurrency(value)} at risk).`,
        actionLabel: isFa ? 'مشاهده در مرکز انقضا' : 'View in Expiry Centre',
        color: 'border-orange-200 bg-orange-50',
      });
    }

    // 2. Move to front shelf
    const expiring7 = batches.filter(b => {
      const d = getDaysUntilExpiry(b.expiryDate);
      return b.status === 'active' && d > 3 && d <= 7;
    });
    if (expiring7.length > 0) {
      recs.push({
        id: 'priority-shelf',
        icon: <TrendingUp size={14} className="text-blue-500" />,
        text: isFa
          ? `${formatNumber(expiring7.length)} دسته در ۷ روز آینده منقضی می‌شود. انتقال به قفسه اولویت‌دار را بررسی کنید.`
          : `${expiring7.length} batch(es) expire in 7 days. Move to priority shelf for better visibility.`,
        actionLabel: isFa ? 'ایجاد عملیات' : 'Create Operation',
        color: 'border-blue-200 bg-blue-50',
      });
    }

    // 3. Restock recommendation
    const lowStock = inventoryItems.filter(i => i.stockStatus === 'low-stock');
    if (lowStock.length > 0) {
      recs.push({
        id: 'restock',
        icon: <Package size={14} className="text-amber-500" />,
        text: isFa
          ? `${formatNumber(lowStock.length)} محصول زیر حداقل موجودی است. سفارش جدید ثبت کنید.`
          : `${lowStock.length} product(s) below minimum stock. Raise purchase orders.`,
        actionLabel: isFa ? 'مشاهده موجودی' : 'View Inventory',
        color: 'border-amber-200 bg-amber-50',
      });
    }

    // 4. Reduce overstock
    const overstock = inventoryItems.filter(i => i.stockStatus === 'overstock');
    if (overstock.length > 0) {
      recs.push({
        id: 'reduce-stock',
        icon: <Truck size={14} className="text-purple-500" />,
        text: isFa
          ? `${formatNumber(overstock.length)} محصول بیش از حد موجود است. کاهش سفارش بعدی را بررسی کنید.`
          : `${overstock.length} product(s) are overstocked. Consider reducing your next supplier order.`,
        actionLabel: isFa ? 'بررسی تأمین‌کنندگان' : 'Review Suppliers',
        color: 'border-purple-200 bg-purple-50',
      });
    }

    return recs.slice(0, maxItems);
  }, [batches, inventoryItems, isFa, formatCurrency, formatNumber, maxItems]);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
        <Lightbulb size={14} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">
          {isFa ? 'پیشنهادهای هوشمند' : 'Smart Recommendations'}
        </h3>
      </div>
      <div className="space-y-1.5">
        {recommendations.map(rec => (
          <div key={rec.id} className={cn('flex items-start gap-2.5 p-3 rounded-lg border text-xs', rec.color, isRTL && 'flex-row-reverse')}>
            <span className="flex-shrink-0 mt-0.5">{rec.icon}</span>
            <p className={cn('flex-1 text-slate-700 leading-relaxed', isRTL && 'text-right')}>{rec.text}</p>
            {onNavigate && (
              <button
                onClick={() => onNavigate(rec.id.includes('expir') ? 'expiry' : rec.id.includes('stock') ? 'inventory' : 'operations')}
                className={cn('flex items-center gap-0.5 text-green-700 hover:text-green-900 font-medium flex-shrink-0 whitespace-nowrap', isRTL && 'flex-row-reverse')}
              >
                {rec.actionLabel}
                <ChevronRight size={10} className={cn(isRTL && 'rotate-180')} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
