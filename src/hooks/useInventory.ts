import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useLanguageStore } from '@/stores/languageStore';
import { products } from '@/data/products';
import { computeInventoryItems, computeAttentionItems } from '@/services/inventoryService';
import { getDaysUntilExpiry } from '@/lib/utils';

export function useInventory() {
  const { batches } = useAppStore();
  const { language } = useLanguageStore();

  const inventoryItems = useMemo(
    () => computeInventoryItems(products, batches),
    [batches]
  );

  const attentionItems = useMemo(
    () => computeAttentionItems(inventoryItems, language),
    [inventoryItems, language]
  );

  const metrics = useMemo(() => {
    const activeBatches = batches.filter(b => b.status === 'active');
    const expiredBatches   = activeBatches.filter(b => getDaysUntilExpiry(b.expiryDate) < 0);
    const expiringSoon     = activeBatches.filter(b => {
      const d = getDaysUntilExpiry(b.expiryDate);
      return d >= 0 && d <= 7;
    });
    const expiringToday    = activeBatches.filter(b => getDaysUntilExpiry(b.expiryDate) === 0);
    const expiringIn3Days  = activeBatches.filter(b => {
      const d = getDaysUntilExpiry(b.expiryDate);
      return d > 0 && d <= 3;
    });
    const lowStockItems    = inventoryItems.filter(i =>
      i.stockStatus === 'low-stock' || i.stockStatus === 'out-of-stock'
    );
    const totalValue     = inventoryItems.reduce((s, i) => s + i.totalValue, 0);
    const valueAtRisk    = expiringSoon.reduce((s, b) => s + b.quantity * b.sellingPrice, 0)
                         + expiredBatches.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);

    return {
      totalValue,
      valueAtRisk,
      expiredCount:        expiredBatches.length,
      expiringSoonCount:   expiringSoon.length,
      expiringTodayCount:  expiringToday.length,
      expiringIn3DaysCount:expiringIn3Days.length,
      lowStockCount:       lowStockItems.length,
      totalProducts:       products.length,
      activeBatchCount:    activeBatches.length,
    };
  }, [batches, inventoryItems]);

  return { inventoryItems, attentionItems, metrics };
}
