import type { InventoryItem, Product, ProductBatch, RiskLevel, AttentionItem } from '@/types';
import { getDaysUntilExpiry, getRiskLevel } from '@/lib/utils';

// ── Compute full inventory items ─────────────────────────────────────────────

export function computeInventoryItems(
  products: Product[],
  batches: ProductBatch[]
): InventoryItem[] {
  return products.map((product) => {
    const productBatches = batches
      .filter(b => b.productId === product.id && b.status !== 'removed')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const activeBatches = productBatches.filter(b => b.status === 'active');
    const totalQuantity = activeBatches.reduce((s, b) => s + b.quantity, 0);
    const totalValue    = activeBatches.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);

    const earliestBatch  = productBatches[0] ?? null;
    const earliestExpiry = earliestBatch?.expiryDate ?? null;
    const daysUntilExpiry = earliestExpiry ? getDaysUntilExpiry(earliestExpiry) : null;

    const riskLevel: RiskLevel = getRiskLevel(daysUntilExpiry, totalQuantity);

    let stockStatus: InventoryItem['stockStatus'];
    if (totalQuantity === 0)                          stockStatus = 'out-of-stock';
    else if (totalQuantity < product.minStockLevel)   stockStatus = 'low-stock';
    else if (totalQuantity > product.maxStockLevel)   stockStatus = 'overstock';
    else                                               stockStatus = 'in-stock';

    return {
      product,
      batches: productBatches,
      totalQuantity,
      earliestExpiry,
      daysUntilExpiry,
      riskLevel,
      totalValue,
      stockStatus,
    };
  });
}

// ── Compute attention items ──────────────────────────────────────────────────

export function computeAttentionItems(
  items: InventoryItem[],
  lang: 'en' | 'fa' = 'en'
): AttentionItem[] {
  const attention: AttentionItem[] = [];
  const isFa = lang === 'fa';

  function currency(v: number) {
    if (isFa) {
      const toman = Math.round(v * 65000);
      return toman.toLocaleString('fa-IR') + ' تومان';
    }
    return `£${v.toFixed(2)}`;
  }

  for (const item of items) {
    const { product, batches, totalQuantity, totalValue } = item;

    // ---- Check each batch ----
    for (const batch of batches) {
      if (batch.status !== 'active') continue;
      const days = getDaysUntilExpiry(batch.expiryDate);
      const batchValue = batch.quantity * batch.sellingPrice;

      if (days < 0) {
        attention.push({
          id: `att-exp-${batch.id}`,
          severity: 'critical',
          type: 'expired',
          productId: product.id,
          productName: product.name,
          batchId: batch.id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysRemaining: days,
          estimatedValueAtRisk: batchValue,
          recommendedAction: isFa
            ? `${batch.quantity} واحد منقضی شده است. فوراً از قفسه جمع‌آوری کنید.`
            : `Remove all ${batch.quantity} units immediately and dispose according to store policy.`,
          actionLabel: isFa ? 'ایجاد عملیات جمع‌آوری' : 'Create Removal Operation',
        });
      } else if (days === 0) {
        attention.push({
          id: `att-today-${batch.id}`,
          severity: 'critical',
          type: 'expiring-soon',
          productId: product.id,
          productName: product.name,
          batchId: batch.id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysRemaining: days,
          estimatedValueAtRisk: batchValue,
          recommendedAction: isFa
            ? `${batch.quantity} واحد امروز منقضی می‌شود. تخفیف فوری اعمال کنید یا از قفسه بردارید.`
            : `${batch.quantity} units expire today. Apply immediate discount or remove from shelf.`,
          actionLabel: isFa ? 'بررسی تخفیف' : 'Review Discount',
        });
      } else if (days <= 3) {
        const rec = isFa
          ? `${batch.quantity} واحد در ${days} روز دیگر منقضی می‌شود. ارزش در معرض خطر: ${currency(batchValue)}. پیشنهاد: ۲۰–۳۰٪ تخفیف.`
          : `${batch.quantity} units expire in ${days} day${days > 1 ? 's' : ''}. Value at risk: ${currency(batchValue)}. Consider a ${25}% discount.`;
        attention.push({
          id: `att-3d-${batch.id}`,
          severity: days <= 1 ? 'critical' : 'high',
          type: 'expiring-soon',
          productId: product.id,
          productName: product.name,
          batchId: batch.id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysRemaining: days,
          estimatedValueAtRisk: batchValue,
          recommendedAction: rec,
          actionLabel: isFa ? 'بررسی تخفیف' : 'Review Discount',
        });
      } else if (days <= 7 && batch.quantity > 20) {
        attention.push({
          id: `att-high-${batch.id}`,
          severity: 'medium',
          type: 'high-stock-expiry',
          productId: product.id,
          productName: product.name,
          batchId: batch.id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysRemaining: days,
          estimatedValueAtRisk: batchValue,
          recommendedAction: isFa
            ? `${batch.quantity} واحد با ${days} روز تا انقضا. یک تخفیف تبلیغاتی برای کاهش موجودی در نظر بگیرید.`
            : `${batch.quantity} units with ${days} days until expiry. Consider a promotional discount to reduce stock.`,
          actionLabel: isFa ? 'ایجاد عملیات تخفیف' : 'Create Discount Review',
        });
      }
    }

    // ---- Low stock ----
    if (totalQuantity > 0 && totalQuantity < product.minStockLevel) {
      attention.push({
        id: `att-low-${product.id}`,
        severity: totalQuantity <= Math.floor(product.minStockLevel / 2) ? 'critical' : 'high',
        type: 'low-stock',
        productId: product.id,
        productName: product.name,
        batchId: null,
        quantity: totalQuantity,
        expiryDate: null,
        daysRemaining: null,
        estimatedValueAtRisk: totalValue,
        recommendedAction: isFa
          ? `فقط ${totalQuantity} واحد باقی مانده (حداقل: ${product.minStockLevel}). فوراً درخواست خرید ثبت کنید.`
          : `Only ${totalQuantity} units remaining (minimum: ${product.minStockLevel}). Raise a purchase request immediately.`,
        actionLabel: isFa ? 'ایجاد عملیات تأمین موجودی' : 'Create Restock Operation',
      });
    }
  }

  return attention.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
}
