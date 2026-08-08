import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAIStore } from '@/stores/aiStore';
import { products } from '@/data/products';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn, getDaysUntilExpiry } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { motion } from 'framer-motion';
import {
  Brain, Sparkles, AlertTriangle, TrendingDown, Package,
  Zap, ChevronRight, CheckCircle2, Search, Filter,
  ClipboardList, GitBranch, ArrowUpRight, ShieldAlert,
} from 'lucide-react';
import { ProductDetailDrawer } from '@/features/inventory/ProductDetailDrawer';
import type { ProductCategory, InventoryItem, RiskLevel } from '@/types';

// Circular Progress Component
function CircularProgress({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#ef4444' :
    score >= 60 ? '#f97316' :
    score >= 35 ? '#f59e0b' : '#22c55e';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export function AIProductIntelligencePage() {
  const { batches, addOperation, addActivity, addNotification, currentUserId } = useAppStore();
  const { suppliers } = useSettingsStore();
  const { setPanelOpen } = useAIStore();
  const { t, isRTL, language } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatNumber } = useLocale();
  const isFa = language === 'fa';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortOption, setSortOption] = useState<'risk-desc' | 'risk-asc' | 'name'>('risk-desc');
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<InventoryItem | null>(null);
  const [createdOpProductId, setCreatedOpProductId] = useState<string | null>(null);

  // Compute product intelligence items
  const productIntelliItems = useMemo(() => {
    return products.map(product => {
      const prodBatches = batches.filter(b => b.productId === product.id && b.status === 'active');
      const totalQty = prodBatches.reduce((s, b) => s + b.quantity, 0);

      // Expiry calculation
      let minDays = 999;
      prodBatches.forEach(b => {
        const d = getDaysUntilExpiry(b.expiryDate);
        if (d < minDays) minDays = d;
      });

      // Calculate dynamic risk score (0 - 100)
      let riskScore = 15;
      const reasons: string[] = [];
      let recommendation = isFa ? 'وضعیت محصول پایدار است' : 'Product status is stable';
      let impact = isFa ? 'موجودی بهینه' : 'Optimal Inventory';
      let confidence = 92;

      if (minDays <= 0) {
        riskScore += 80;
        reasons.push(isFa ? 'دسته منقضی شده' : 'Expired batch');
        recommendation = isFa ? 'جمع‌آوری فوری از قفسه' : 'Immediate removal from shelf';
        impact = isFa ? 'جلوگیری از خطرات سلامتی' : 'Prevent health hazard';
        confidence = 99;
      } else if (minDays <= 3) {
        riskScore += 65;
        reasons.push(isFa ? `انقضا در ${minDays} روز` : `Expiry in ${minDays} days`);
        recommendation = isFa ? 'اعمال ۲۵٪ تخفیف و انتقال به قفسه اول' : 'Apply 25% markdown & move to front shelf';
        impact = isFa ? `حفاظت از ${formatCurrency(totalQty * product.sellingPrice)} سرمایه` : `Protect ${formatCurrency(totalQty * product.sellingPrice)} value`;
        confidence = 94;
      } else if (minDays <= 7) {
        riskScore += 35;
        reasons.push(isFa ? `انقضا تا هفته آینده` : `Expiring next week`);
        recommendation = isFa ? 'بررسی تخفیف و گردش‌کار خودکار' : 'Review markdown & automated workflow';
        impact = isFa ? 'کاهش ریسک ضایعات' : 'Waste reduction';
        confidence = 88;
      }

      if (totalQty < product.minStockLevel) {
        riskScore += 35;
        reasons.push(isFa ? 'کمبود موجودی' : 'Low stock level');
        if (riskScore < 50) {
          recommendation = isFa ? 'ثبت فوری درخواست خرید از تأمین‌کننده' : 'Create purchase request with supplier';
          impact = isFa ? 'جلوگیری از ناموجودی' : 'Prevent stockout loss';
        }
        confidence = 91;
      } else if (totalQty > product.maxStockLevel) {
        riskScore += 20;
        reasons.push(isFa ? 'موجودی اضافه' : 'Overstock');
      }

      const totalValue = totalQty * product.sellingPrice;
      if (totalValue > 200 && minDays <= 10) {
        riskScore += 15;
        reasons.push(isFa ? 'ارزش مالی بالا در معرض خطر' : 'High value at risk');
      }

      riskScore = Math.min(99, Math.max(12, riskScore));

      const supplierName = suppliers.find(s => s.id === product.supplierId)?.name ?? 'Supplier';

      return {
        product,
        batches: prodBatches,
        totalQty,
        minDays,
        riskScore,
        reasons,
        recommendation,
        impact,
        confidence,
        supplierName,
      };
    });
  }, [batches, suppliers, formatCurrency, isFa]);

  // Filter & Sort items
  const filteredItems = useMemo(() => {
    let items = [...productIntelliItems];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.product.name.toLowerCase().includes(q) ||
        i.product.sku.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) items = items.filter(i => i.product.category === categoryFilter);
    if (supplierFilter) items = items.filter(i => i.product.supplierId === supplierFilter);

    if (riskFilter === 'critical') items = items.filter(i => i.riskScore >= 80);
    else if (riskFilter === 'high') items = items.filter(i => i.riskScore >= 60 && i.riskScore < 80);
    else if (riskFilter === 'medium') items = items.filter(i => i.riskScore >= 35 && i.riskScore < 60);
    else if (riskFilter === 'low') items = items.filter(i => i.riskScore < 35);

    items.sort((a, b) => {
      if (sortOption === 'risk-desc') return b.riskScore - a.riskScore;
      if (sortOption === 'risk-asc') return a.riskScore - b.riskScore;
      return a.product.name.localeCompare(b.product.name);
    });

    return items;
  }, [productIntelliItems, search, categoryFilter, supplierFilter, riskFilter, sortOption]);

  function handleGenerateOperation(item: typeof productIntelliItems[0]) {
    addOperation({
      title: isFa ? `عملیات هوشمند: ${item.recommendation}` : `AI Operation: ${item.recommendation}`,
      description: isFa
        ? `عملیات پیشنهادی AI برای ${item.product.name} (نمره ریسک ${item.riskScore}٪)`
        : `AI generated operation for ${item.product.name} (Risk score ${item.riskScore}%)`,
      type: item.minDays <= 3 ? 'discount-review' : 'restock',
      priority: item.riskScore >= 80 ? 'critical' : item.riskScore >= 60 ? 'high' : 'medium',
      status: 'pending',
      productId: item.product.id,
      batchId: item.batches[0]?.id ?? null,
      assignedUserId: 'user-001',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      sourceWorkflowId: null,
      sourceWorkflowName: 'AI Product Intelligence',
      completedAt: null,
      completedBy: null,
      notes: null,
    });

    addNotification({
      type: 'operation-assigned',
      title: isFa ? `عملیات هوشمند ایجاد شد` : `AI Operation Created`,
      message: `${item.product.name} · ${item.recommendation}`,
      isRead: false,
      relatedEntityId: item.product.id,
      relatedEntityType: 'product',
    });

    setCreatedOpProductId(item.product.id);
    setTimeout(() => setCreatedOpProductId(null), 2500);
  }

  function handleOpenDrawer(product: typeof products[0], prodBatches: typeof batches) {
    const totalQty = prodBatches.reduce((s, b) => s + b.quantity, 0);
    let minDays = 999;
    prodBatches.forEach(b => {
      const d = getDaysUntilExpiry(b.expiryDate);
      if (d < minDays) minDays = d;
    });

    let riskLevel: RiskLevel = 'normal';
    if (minDays <= 0) riskLevel = 'critical';
    else if (minDays <= 3) riskLevel = 'urgent';
    else if (minDays <= 7) riskLevel = 'attention';

    setSelectedDrawerItem({
      product,
      batches: prodBatches,
      totalQuantity: totalQty,
      earliestExpiry: prodBatches[0]?.expiryDate ?? null,
      daysUntilExpiry: minDays === 999 ? null : minDays,
      riskLevel,
      totalValue: totalQty * product.sellingPrice,
      stockStatus: totalQty < product.minStockLevel ? 'low-stock' : 'in-stock',
    });
  }

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', isRTL && 'text-right')}>
        <div>
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center shadow-md">
              <Brain size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isFa ? 'هوش مصنوعی سلامت محصولات' : 'AI Product Intelligence'}
            </h1>
            <Badge variant="info" size="sm">{isFa ? 'پایش زنده' : 'Live Monitor'}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isFa ? 'تحلیل مستمر سلامت، ریسک انقضا و پیشنهادات عملیاتی برای هر محصول' : 'Continuous health, expiry risk and automated action analysis per product'}
          </p>
        </div>

        <Button
          leftIcon={<Sparkles size={15} />}
          onClick={() => setPanelOpen(true)}
          className="flex-shrink-0"
        >
          {isFa ? 'گفتگو با دستیار AI Copilot' : 'Open AI Copilot'}
        </Button>
      </div>

      {/* Main Layout: Filters on Left/Top, Grid on Right */}
      <div className="grid lg:grid-cols-4 gap-5">
        {/* Left Filter Column */}
        <div className="space-y-4">
          <Card padding="md" className="space-y-4 sticky top-4 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-200/40 rounded-2xl p-5">
            <div className={cn('flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-xs', isRTL && 'flex-row-reverse')}>
              <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                <Filter size={14} className="text-green-700" />
              </div>
              <span>{isRTL ? 'فیلترهای هوشمند' : 'Smart Filters'}</span>
            </div>

            {/* Search */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                {isRTL ? 'جستجوی محصول' : 'Search Product'}
              </label>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isFa ? 'نام محصول یا کد SKU…' : 'Product name or SKU…'}
                className="text-xs"
              />
            </div>

            {/* Category */}
            <CustomSelect
              label={isRTL ? 'دسته دسته‌بندی' : 'Category'}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: '', label: isFa ? 'همه دسته‌ها' : 'All Categories' },
                ...Array.from(new Set(products.map(p => p.category))).map(cat => ({
                  value: cat,
                  label: t.categories[cat as keyof typeof t.categories] ?? cat,
                })),
              ]}
            />

            {/* Risk Level */}
            <CustomSelect
              label={isRTL ? 'سطح ریسک' : 'Risk Level'}
              value={riskFilter}
              onChange={setRiskFilter}
              options={[
                { value: '', label: isFa ? 'همه سطح‌های ریسک' : 'All Risk Levels' },
                { value: 'critical', label: isFa ? 'بحرانی (۸۰٪+)' : 'Critical (80%+)' },
                { value: 'high', label: isFa ? 'بالا (۶۰٪ - ۸۰٪)' : 'High (60% - 80%)' },
                { value: 'medium', label: isFa ? 'متوسط (۳۵٪ - ۶۰٪)' : 'Medium (35% - 60%)' },
                { value: 'low', label: isFa ? 'پایین (<۳۵٪)' : 'Low (<35%)' },
              ]}
            />

            {/* Supplier */}
            <CustomSelect
              label={isRTL ? 'تأمین‌کننده' : 'Supplier'}
              value={supplierFilter}
              onChange={setSupplierFilter}
              options={[
                { value: '', label: isFa ? 'همه تأمین‌کنندگان' : 'All Suppliers' },
                ...suppliers.map(s => ({
                  value: s.id,
                  label: isFa && s.nameFa ? s.nameFa : s.name,
                })),
              ]}
            />

            {/* Sorting */}
            <CustomSelect
              label={isRTL ? 'مرتب‌سازی بر اساس' : 'Sort By'}
              value={sortOption}
              onChange={v => setSortOption(v as any)}
              options={[
                { value: 'risk-desc', label: isFa ? 'بیشترین ریسک' : 'Highest Risk' },
                { value: 'risk-asc', label: isFa ? 'کمترین ریسک' : 'Lowest Risk' },
                { value: 'name', label: isFa ? 'نام محصول' : 'Product Name' },
              ]}
            />
          </Card>
        </div>

        {/* Right Cards Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className={cn('flex items-center justify-between text-xs text-slate-500', isRTL && 'flex-row-reverse')}>
            <span>{isFa ? `نمایش ${formatNumber(filteredItems.length)} محصول` : `Showing ${filteredItems.length} products`}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card padding="md" className="h-full flex flex-col justify-between border hover:shadow-md transition-all">
                  <div className="space-y-3">
                    {/* Header: Name + Circular Progress */}
                    <div className={cn('flex items-start justify-between gap-3', isRTL && 'flex-row-reverse')}>
                      <div className={cn('space-y-1', isRTL && 'text-right')}>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {isRTL && item.product.nameFa ? item.product.nameFa : item.product.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {item.product.sku} · {item.supplierName}
                        </p>
                      </div>
                      <CircularProgress score={item.riskScore} />
                    </div>

                    {/* Reasons Badges */}
                    <div className={cn('flex flex-wrap gap-1.5', isRTL && 'flex-row-reverse')}>
                      {item.reasons.map(r => (
                        <span key={r} className="text-[10px] bg-red-50 text-red-700 border border-red-200 rounded-md px-2 py-0.5 font-medium">
                          {r}
                        </span>
                      ))}
                    </div>

                    {/* AI Recommendation Box */}
                    <div className={cn('bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-100', isRTL && 'text-right')}>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {isFa ? 'توصیه هوش مصنوعی' : 'AI Recommendation'}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {item.recommendation}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{isFa ? 'تأثیر:' : 'Impact:'}</span> {item.impact}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 mt-4">
                    <div className={cn('flex items-center justify-between text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
                      <span>{isFa ? 'اطمینان AI:' : 'AI Confidence:'} <strong className="text-slate-700">{item.confidence}%</strong></span>
                      <span>{formatNumber(item.totalQty)} {t.common.units} {isRTL ? 'موجودی' : 'in stock'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="xs"
                        variant={createdOpProductId === item.product.id ? 'primary' : 'outline'}
                        leftIcon={createdOpProductId === item.product.id ? <CheckCircle2 size={12} /> : <ClipboardList size={12} />}
                        onClick={() => handleGenerateOperation(item)}
                      >
                        {createdOpProductId === item.product.id
                          ? (isFa ? 'عملیات ایجاد شد' : 'Op Created!')
                          : (isFa ? 'ایجاد عملیات' : 'Generate Op')}
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<ArrowUpRight size={12} />}
                        onClick={() => handleOpenDrawer(item.product, item.batches)}
                      >
                        {isFa ? 'جزئیات کامل' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card padding="lg" className="text-center py-12">
              <CheckCircle2 size={36} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">
                {isFa ? 'هیچ محصولی با این فیلترها یافت نشد' : 'No products matched the selected filters'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Product Detail Drawer */}
      {selectedDrawerItem && (
        <ProductDetailDrawer
          item={selectedDrawerItem}
          open={!!selectedDrawerItem}
          onClose={() => setSelectedDrawerItem(null)}
          onAddBatch={() => {}}
        />
      )}
    </div>
  );
}
