import { Dialog } from '@/components/ui/Dialog';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { products } from '@/data/products';
import { useSettingsStore } from '@/stores/settingsStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  batchCode: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  expiryDate: z.string().min(1),
  supplierId: z.string().min(1),
  purchaseCost: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  storageLocation: z.string().min(2),
});
type FormValues = z.infer<typeof schema>;

interface AddBatchDialogProps {
  open: boolean;
  onClose: () => void;
  defaultProductId?: string | null;
}

export function AddBatchDialog({ open, onClose, defaultProductId }: AddBatchDialogProps) {
  const { addBatch, addActivity } = useAppStore();
  const { suppliers } = useSettingsStore();
  const { t, isRTL } = useTranslation();
  const ab = t.addBatch;
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as import('react-hook-form').Resolver<FormValues>,
    defaultValues: {
      productId: defaultProductId ?? '',
      batchCode: '', quantity: undefined, expiryDate: '',
      supplierId: '', purchaseCost: undefined, sellingPrice: undefined, storageLocation: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const product = products.find(p => p.id === values.productId);
    addBatch({
      productId: values.productId,
      batchCode: values.batchCode,
      quantity: values.quantity,
      initialQuantity: values.quantity,
      expiryDate: new Date(values.expiryDate).toISOString(),
      purchaseCost: values.purchaseCost,
      sellingPrice: values.sellingPrice,
      supplierId: values.supplierId,
      storageLocation: values.storageLocation,
      status: 'active',
      receivedDate: new Date().toISOString(),
    });
    addActivity({
      type: 'batch-added',
      title: `${isRTL ? 'دسته جدید اضافه شد' : 'New batch added'}: ${product?.name ?? values.productId}`,
      description: `${isRTL ? 'دسته' : 'Batch'} ${values.batchCode} (${values.quantity} ${t.common.units}) ${isRTL ? 'اضافه شد' : 'added'}.`,
      actorId: 'user-001', actorName: 'Sarah Mitchell',
      relatedEntityId: values.productId, relatedEntityType: 'product', relatedEntityName: product?.name ?? null,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); reset(); onClose(); }, 1200);
  };

  return (
    <Dialog open={open} onClose={onClose} title={ab.title} description={ab.description} size="lg">
      {saved ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-900">{ab.success}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit as import('react-hook-form').SubmitHandler<FormValues>)} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select label={t.common.product} error={errors.productId?.message} {...register('productId')}>
                <option value="">{ab.selectProduct}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </Select>
            </div>
            <Input label={ab.batchCode} placeholder={ab.batchCodePlaceholder} error={errors.batchCode?.message} {...register('batchCode')} />
            <Input label={ab.quantity} type="number" placeholder={ab.quantityPlaceholder} error={errors.quantity?.message} {...register('quantity')} />
            <Input label={ab.expiryDate} type="date" error={errors.expiryDate?.message} {...register('expiryDate')} />
            <Select label={t.common.supplier} error={errors.supplierId?.message} {...register('supplierId')}>
              <option value="">{ab.selectSupplier}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label={ab.purchaseCost} type="number" step="0.01" placeholder="0.00" error={errors.purchaseCost?.message} {...register('purchaseCost')} />
            <Input label={ab.sellingPrice} type="number" step="0.01" placeholder="0.00" error={errors.sellingPrice?.message} {...register('sellingPrice')} />
            <div className="col-span-2">
              <Input label={ab.storageLocation} placeholder={ab.storageLocationPlaceholder} error={errors.storageLocation?.message} {...register('storageLocation')} />
            </div>
          </div>
          <div className={cn('flex justify-end gap-2 pt-2', isRTL && 'flex-row-reverse')}>
            <Button type="button" variant="secondary" onClick={onClose}>{t.common.cancel}</Button>
            <Button type="submit" isLoading={isSubmitting}>{t.common.add}</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
