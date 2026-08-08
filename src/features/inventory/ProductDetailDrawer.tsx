import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { InventoryItem, PurchaseRequestStatus, OperationPriority } from '@/types';
import { Plus, ArrowUpDown, Package, ShoppingCart, UserCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { AssignTaskDialog } from '@/features/operations/AssignTaskDialog';

interface ProductDetailDrawerProps {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
  onAddBatch: (productId: string) => void;
}

export function ProductDetailDrawer({ item, open, onClose, onAddBatch }: ProductDetailDrawerProps) {
  const { operations, workflows, purchaseRequests, addPurchaseRequest, changePurchaseRequestStatus } = useAppStore();
  const { suppliers, users } = useSettingsStore();
  const { t, isRTL, language } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate, formatDaysRemaining, formatNumber, getDaysUntilExpiry } = useLocale();
  const isFa = language === 'fa';
  const inv = t.inventory;

  const [activeTab, setActiveTab] = useState<'batches' | 'purchase-requests'>('batches');
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [assigningPRId, setAssigningPRId] = useState<string | null>(null);

  // Form states for new PR
  const [prQuantity, setPrQuantity] = useState(30);
  const [prReason, setPrReason] = useState('');
  const [prPriority, setPrPriority] = useState<OperationPriority>('high');
  const [prSupplierId, setPrSupplierId] = useState(item.product.supplierId);
  const [prExpectedDelivery, setPrExpectedDelivery] = useState(new Date(Date.now() + 172800000).toISOString().split('T')[0]);

  const supplier = suppliers.find(s => s.id === item.product.supplierId);
  const relatedOps = operations.filter(o => o.productId === item.product.id && (o.status === 'pending' || o.status === 'in-progress'));
  const activeWorkflows = workflows.filter(w => w.status === 'active');
  const productPRs = purchaseRequests.filter(pr => pr.productId === item.product.id);

  function handleCreatePR() {
    const selectedSup = suppliers.find(s => s.id === prSupplierId);
    addPurchaseRequest({
      productId: item.product.id,
      productName: item.product.name,
      supplierId: prSupplierId,
      supplierName: selectedSup?.name ?? 'Supplier',
      quantity: Number(prQuantity),
      reason: prReason || (isFa ? 'شارژ مجدد موجودی کم' : 'Restock low inventory'),
      priority: prPriority,
      expectedDelivery: new Date(prExpectedDelivery).toISOString(),
      requester: 'Emma Wilson',
      assignee: null,
      status: 'pending',
    });

    setShowCreatePR(false);
    setPrReason('');
  }

  const prStatusBadge: Record<PurchaseRequestStatus, { variant: 'default'|'warning'|'success'|'danger'|'info'; label: string }> = {
    draft:     { variant: 'default', label: isFa ? 'پیش‌نویس' : 'Draft' },
    pending:   { variant: 'warning', label: isFa ? 'در انتظار' : 'Pending' },
    approved:  { variant: 'success', label: isFa ? 'تایید شده' : 'Approved' },
    rejected:  { variant: 'danger',  label: isFa ? 'رد شده' : 'Rejected' },
    ordered:   { variant: 'info',    label: isFa ? 'سفارش داده شد' : 'Ordered' },
    delivered: { variant: 'success', label: isFa ? 'تحویل شد' : 'Delivered' },
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={isRTL && item.product.nameFa ? item.product.nameFa : item.product.name}
        description={`${item.product.sku} · ${t.categories[item.product.category as keyof typeof t.categories] ?? item.product.category}`}
        width="w-[540px]"
      >
        <div className={cn('p-5 space-y-5', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('batches')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors',
                activeTab === 'batches'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <Package size={14} />
              <span>{isRTL ? 'دسته‌های محصول' : 'Batches'} ({formatNumber(item.batches.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('purchase-requests')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors',
                activeTab === 'purchase-requests'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <ShoppingCart size={14} />
              <span>{isRTL ? 'درخواست‌های خرید' : 'Purchase Requests'} ({formatNumber(productPRs.length)})</span>
            </button>
          </div>

          {/* TAB 1: BATCHES */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
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

              <div>
                <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {isRTL ? 'لیست دسته‌ها' : 'Batch List'}
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
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PURCHASE REQUESTS */}
          {activeTab === 'purchase-requests' && (
            <div className="space-y-4">
              <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {isRTL ? 'درخواست‌های ثبت شده' : 'Registered Purchase Requests'}
                </h3>
                <Button size="xs" leftIcon={<Plus size={11} />} onClick={() => setShowCreatePR(true)}>
                  {isRTL ? 'ثبت درخواست جدید' : 'Create Request'}
                </Button>
              </div>

              {/* Form to create PR */}
              {showCreatePR && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-800">
                    {isRTL ? 'ایجاد درخواست خرید جدید' : 'New Purchase Request'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{isRTL ? 'تعداد' : 'Quantity'}</label>
                      <Input
                        type="number"
                        value={prQuantity}
                        onChange={e => setPrQuantity(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{isRTL ? 'تأمین‌کننده' : 'Supplier'}</label>
                      <Select
                        value={prSupplierId}
                        onChange={e => setPrSupplierId(e.target.value)}
                        className="text-xs"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{isRTL ? 'تحویل مورد انتظار' : 'Expected Delivery'}</label>
                      <Input
                        type="date"
                        value={prExpectedDelivery}
                        onChange={e => setPrExpectedDelivery(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{isRTL ? 'اولویت' : 'Priority'}</label>
                      <Select
                        value={prPriority}
                        onChange={e => setPrPriority(e.target.value as OperationPriority)}
                        className="text-xs"
                      >
                        <option value="low">{isFa ? 'پایین' : 'Low'}</option>
                        <option value="medium">{isFa ? 'متوسط' : 'Medium'}</option>
                        <option value="high">{isFa ? 'بالا' : 'High'}</option>
                        <option value="critical">{isFa ? 'بحرانی' : 'Critical'}</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">{isRTL ? 'دلیل درخواست' : 'Reason'}</label>
                    <Input
                      value={prReason}
                      onChange={e => setPrReason(e.target.value)}
                      placeholder={isFa ? 'علت نیاز به شارژ موجودی…' : 'Reason for purchase request…'}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="xs" onClick={() => setShowCreatePR(false)}>
                      {t.common.cancel}
                    </Button>
                    <Button size="xs" onClick={handleCreatePR}>
                      {isRTL ? 'ذخیره درخواست' : 'Save Request'}
                    </Button>
                  </div>
                </div>
              )}

              {/* List of PRs */}
              <div className="space-y-3">
                {productPRs.map(pr => {
                  const cfg = prStatusBadge[pr.status];
                  return (
                    <div key={pr.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white hover:border-green-300 transition-colors">
                      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                          <ShoppingCart size={15} className="text-slate-500" />
                          <span className="text-xs font-semibold text-slate-800">{formatNumber(pr.quantity)} {t.common.units}</span>
                          <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{pr.supplierName}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{pr.reason}</p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <div>{isFa ? 'درخواست‌کننده:' : 'Requester:'} <span className="font-medium text-slate-700">{pr.requester}</span></div>
                        <div>{isFa ? 'مسئول:' : 'Assignee:'} <span className="font-medium text-slate-700">{pr.assignee ?? '—'}</span></div>
                      </div>

                      {/* Action Bar for PR */}
                      <div className={cn('flex items-center justify-between pt-1 gap-1.5', isRTL && 'flex-row-reverse')}>
                        <button
                          onClick={() => setAssigningPRId(pr.id)}
                          className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <UserCheck size={12} />
                          <span>{isFa ? 'تخصیص / اشتراک' : 'Assign / Share'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {pr.status !== 'approved' && (
                            <button
                              onClick={() => changePurchaseRequestStatus(pr.id, 'approved')}
                              className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md hover:bg-green-100 transition-colors"
                            >
                              <CheckCircle size={12} />
                              <span>{isFa ? 'تایید' : 'Approve'}</span>
                            </button>
                          )}
                          {pr.status !== 'rejected' && (
                            <button
                              onClick={() => changePurchaseRequestStatus(pr.id, 'rejected')}
                              className="flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                            >
                              <XCircle size={12} />
                              <span>{isFa ? 'رد' : 'Reject'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {productPRs.length === 0 && !showCreatePR && (
                  <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <ShoppingCart size={22} className="mx-auto mb-1 text-slate-300" />
                    <p>{isRTL ? 'هیچ درخواست خریدی ثبت نشده است' : 'No purchase requests recorded for this product'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Operations & Workflows */}
          {relatedOps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
        </div>
      </Drawer>

      {/* Assign Task Dialog */}
      {assigningPRId && (
        <AssignTaskDialog
          open={!!assigningPRId}
          onClose={() => setAssigningPRId(null)}
          title={`Purchase Request for ${item.product.name}`}
          itemType="purchase-request"
          itemId={assigningPRId}
          currentPriority={prPriority}
        />
      )}
    </>
  );
}
