import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { products } from '@/data/products';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInventory } from '@/hooks/useInventory';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn, getDaysUntilExpiry } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search, Plus, Package, SortAsc, SortDesc,
  ChevronRight, AlertTriangle, TrendingDown, CheckCircle2,
} from 'lucide-react';
import type { InventoryItem, ProductCategory, RiskLevel } from '@/types';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { AddBatchDialog } from './AddBatchDialog';

const categoriesEn: ProductCategory[] = [
  'Dairy','Meat & Poultry','Bakery','Produce','Seafood','Deli',
  'Frozen','Beverages','Snacks','Condiments','Canned Goods','Health & Beauty',
];

export function InventoryPage() {
  const { batches } = useAppStore();
  const { suppliers } = useSettingsStore();
  const { inventoryItems, metrics } = useInventory();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDaysRemaining, formatNumber } = useLocale();
  const inv = t.inventory;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortField, setSortField] = useState<'name'|'expiry'|'quantity'|'risk'>('risk');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [addBatchProduct, setAddBatchProduct] = useState<string | null>(null);

  const riskConfig: Record<RiskLevel, { variant: 'danger'|'warning'|'success'|'default'; label: string }> = {
    critical:  { variant: 'danger',  label: inv.critical },
    urgent:    { variant: 'warning', label: inv.urgent },
    attention: { variant: 'warning', label: inv.attention },
    normal:    { variant: 'success', label: inv.normal },
  };

  const stockConfig: Record<string, { variant: 'danger'|'warning'|'success'|'default'|'info'; label: string }> = {
    'in-stock':     { variant: 'success', label: inv.inStock },
    'low-stock':    { variant: 'warning', label: inv.lowStockLabel },
    'out-of-stock': { variant: 'danger',  label: inv.outOfStock },
    'overstock':    { variant: 'info',    label: inv.overstock },
  };

  const filtered = useMemo(() => {
    const riskOrder = { critical: 0, urgent: 1, attention: 2, normal: 3 };
    let items = [...inventoryItems];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.product.name.toLowerCase().includes(q) ||
        i.product.sku.toLowerCase().includes(q) ||
        i.product.storageLocation.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) items = items.filter(i => i.product.category === categoryFilter);
    if (stockFilter)    items = items.filter(i => i.stockStatus === stockFilter);
    if (riskFilter)     items = items.filter(i => i.riskLevel === riskFilter);
    if (supplierFilter) items = items.filter(i => i.product.supplierId === supplierFilter);
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name')          cmp = a.product.name.localeCompare(b.product.name);
      else if (sortField === 'expiry')   cmp = (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999);
      else if (sortField === 'quantity') cmp = a.totalQuantity - b.totalQuantity;
      else if (sortField === 'risk')     cmp = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [inventoryItems, search, categoryFilter, stockFilter, riskFilter, supplierFilter, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <SortAsc size={12} className="text-green-700" /> : <SortDesc size={12} className="text-green-700" />)
      : <SortAsc size={12} className="text-slate-300" />;

  const hasFilters = !!(search || categoryFilter || stockFilter || riskFilter || supplierFilter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{inv.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatNumber(products.length)} {inv.products} · {formatNumber(batches.filter(b => b.status === 'active').length)} {inv.activeBatches}
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => { setAddBatchProduct(null); setAddBatchOpen(true); }}>
          {inv.addBatch}
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: inv.totalValue,    value: formatCurrency(metrics.totalValue),       icon: <Package size={14} />, bg: 'bg-slate-50',  color: 'text-slate-700' },
          { label: inv.expiringSoon,  value: formatNumber(metrics.expiringSoonCount),  icon: <AlertTriangle size={14} />, bg: metrics.expiringSoonCount > 0 ? 'bg-orange-50' : 'bg-slate-50', color: metrics.expiringSoonCount > 0 ? 'text-orange-600' : 'text-slate-500' },
          { label: inv.lowStock,      value: formatNumber(metrics.lowStockCount),      icon: <TrendingDown size={14} />,  bg: metrics.lowStockCount > 0 ? 'bg-amber-50' : 'bg-slate-50',  color: metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500' },
          { label: inv.healthyStock,  value: formatNumber(inventoryItems.filter(i => i.riskLevel === 'normal' && i.stockStatus === 'in-stock').length), icon: <CheckCircle2 size={14} />, bg: 'bg-green-50', color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-lg border border-slate-200 px-3 py-2.5 flex items-center gap-2.5', s.bg, isRTL && 'flex-row-reverse')}>
            <span className={s.color}>{s.icon}</span>
            <div className={cn(isRTL && 'text-right')}>
              <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
              <div className="text-[11px] text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className={cn('flex flex-wrap gap-2 items-center', isRTL && 'flex-row-reverse')}>
          <Input
            placeholder={inv.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={13} />}
            className="w-52"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-36 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
            <option value="">{inv.allCategories}</option>
            {categoriesEn.map(c => (
              <option key={c} value={c}>{t.categories[c as keyof typeof t.categories] ?? c}</option>
            ))}
          </Select>
          <Select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="w-32 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
            <option value="">{inv.allStock}</option>
            <option value="in-stock">{inv.inStock}</option>
            <option value="low-stock">{inv.lowStockLabel}</option>
            <option value="out-of-stock">{inv.outOfStock}</option>
            <option value="overstock">{inv.overstock}</option>
          </Select>
          <Select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-32 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
            <option value="">{inv.allRisk}</option>
            <option value="critical">{inv.critical}</option>
            <option value="urgent">{inv.urgent}</option>
            <option value="attention">{inv.attention}</option>
            <option value="normal">{inv.normal}</option>
          </Select>
          <Select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="w-44 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
            <option value="">{inv.allSuppliers}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter(''); setRiskFilter(''); setSupplierFilter(''); }}>
              {t.common.clear}
            </Button>
          )}
          <span className={cn('text-xs text-slate-400', !isRTL && 'ml-auto', isRTL && 'mr-auto')}>
            {formatNumber(filtered.length)} {t.common.results}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500', isRTL ? 'text-right' : 'text-left')}>
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-800">
                    {inv.productCol} <SortIcon field="name" />
                  </button>
                </th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500 hidden lg:table-cell', isRTL ? 'text-right' : 'text-left')}>{inv.categoryCol}</th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell', isRTL ? 'text-right' : 'text-left')}>{inv.batchesCol}</th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500', isRTL ? 'text-right' : 'text-left')}>
                  <button onClick={() => toggleSort('quantity')} className="flex items-center gap-1 hover:text-slate-800">
                    {inv.qtyCol} <SortIcon field="quantity" />
                  </button>
                </th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500 hidden xl:table-cell', isRTL ? 'text-right' : 'text-left')}>{inv.locationCol}</th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500', isRTL ? 'text-right' : 'text-left')}>
                  <button onClick={() => toggleSort('expiry')} className="flex items-center gap-1 hover:text-slate-800">
                    {inv.expiryCol} <SortIcon field="expiry" />
                  </button>
                </th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500', isRTL ? 'text-right' : 'text-left')}>
                  <button onClick={() => toggleSort('risk')} className="flex items-center gap-1 hover:text-slate-800">
                    {inv.riskCol} <SortIcon field="risk" />
                  </button>
                </th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500 hidden sm:table-cell', isRTL ? 'text-right' : 'text-left')}>{inv.stockCol}</th>
                <th className={cn('px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell', isRTL ? 'text-right' : 'text-left')}>{inv.valueCol}</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState icon={<Package size={22} />} title={inv.noProductsFound} description={hasFilters ? inv.adjustFilters : ''} />
                </td></tr>
              ) : (
                filtered.map((item, idx) => {
                  const riskCfg = riskConfig[item.riskLevel];
                  const stockCfg = stockConfig[item.stockStatus];
                  const daysNum = item.daysUntilExpiry;
                  return (
                    <tr
                      key={item.product.id}
                      className={cn(
                        'border-b border-slate-50 hover:bg-slate-50/40 cursor-pointer transition-colors group',
                        idx % 2 !== 0 && 'bg-slate-50/20'
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-4 py-3">
                        <div className={cn(isRTL && 'text-right')}>
                          <p className="font-medium text-slate-900 text-sm group-hover:text-green-800 transition-colors">{item.product.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.product.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                        {t.categories[item.product.category as keyof typeof t.categories] ?? item.product.category}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">
                        <span className="bg-slate-100 rounded-full px-2 py-0.5 text-[11px] font-medium">{formatNumber(item.batches.length)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">{formatNumber(item.totalQuantity)}</span>
                        <span className="text-xs text-slate-400 mx-1">{item.product.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden xl:table-cell">{item.product.storageLocation}</td>
                      <td className="px-4 py-3">
                        {item.earliestExpiry ? (
                          <span className={cn(
                            'text-xs font-semibold',
                            daysNum !== null && daysNum < 0  ? 'text-red-600' :
                            daysNum !== null && daysNum <= 3 ? 'text-orange-600' :
                            daysNum !== null && daysNum <= 7 ? 'text-amber-600' : 'text-slate-600'
                          )}>
                            {formatDaysRemaining(daysNum)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge variant={riskCfg.variant} size="sm">{riskCfg.label}</Badge></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Badge variant={stockCfg.variant} size="sm">{stockCfg.label}</Badge></td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700 hidden md:table-cell">{formatCurrency(item.totalValue)}</td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className={cn('text-slate-300 group-hover:text-slate-500 transition-colors', isRTL && 'rotate-180')} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className={cn('px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between', isRTL && 'flex-row-reverse')}>
            <span className="text-xs text-slate-500">{t.common.showing} {formatNumber(filtered.length)} {t.common.of} {formatNumber(inventoryItems.length)}</span>
            <span className="text-xs text-slate-500">{t.common.total}: <strong className="text-slate-700">{formatCurrency(filtered.reduce((s, i) => s + i.totalValue, 0))}</strong></span>
          </div>
        )}
      </Card>

      {selectedItem && (
        <ProductDetailDrawer item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)}
          onAddBatch={(pid) => { setAddBatchProduct(pid); setSelectedItem(null); setAddBatchOpen(true); }} />
      )}
      <AddBatchDialog open={addBatchOpen} onClose={() => { setAddBatchOpen(false); setAddBatchProduct(null); }} defaultProductId={addBatchProduct} />
    </div>
  );
}
