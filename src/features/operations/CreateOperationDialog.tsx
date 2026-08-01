import { Dialog } from '@/components/ui/Dialog';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { products } from '@/data/products';
import { useSettingsStore } from '@/stores/settingsStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import type { AttentionItem } from '@/types';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  type: z.string().min(1),
  priority: z.string().min(1),
  productId: z.string().optional(),
  assignedUserId: z.string().optional(),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface CreateOperationDialogProps {
  open: boolean;
  onClose: () => void;
  prefilledItem?: AttentionItem | null;
}

export function CreateOperationDialog({ open, onClose, prefilledItem }: CreateOperationDialogProps) {
  const { addOperation, addNotification } = useAppStore();
  const { users } = useSettingsStore();
  const { t, isRTL } = useTranslation();
  const op = t.operations;
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as import('react-hook-form').Resolver<FormValues>,
    defaultValues: {
      title: prefilledItem
        ? prefilledItem.type === 'expired' ? `${isRTL ? 'جمع‌آوری' : 'Remove expired'} ${prefilledItem.productName}`
          : prefilledItem.type === 'low-stock' ? `${isRTL ? 'تأمین موجودی' : 'Restock'} ${prefilledItem.productName}`
          : `${isRTL ? 'بررسی' : 'Review'} ${prefilledItem.productName}`
        : '',
      description: prefilledItem?.recommendedAction ?? '',
      type: prefilledItem?.type === 'expired' ? 'remove-expired' : prefilledItem?.type === 'low-stock' ? 'restock' : 'discount-review',
      priority: prefilledItem?.severity === 'critical' ? 'critical' : prefilledItem?.severity === 'high' ? 'high' : 'medium',
      productId: prefilledItem?.productId ?? '',
      assignedUserId: 'user-001',
      dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    addOperation({
      title: values.title, description: values.description,
      type: values.type as import('@/types').OperationType,
      priority: values.priority as import('@/types').OperationPriority,
      status: 'pending',
      productId: values.productId || null,
      batchId: prefilledItem?.batchId ?? null,
      assignedUserId: values.assignedUserId || null,
      dueDate: new Date(values.dueDate).toISOString(),
      sourceWorkflowId: null, sourceWorkflowName: null,
      completedAt: null, completedBy: null,
      notes: values.notes || null,
    });
    addNotification({
      type: 'operation-assigned',
      title: isRTL ? 'عملیات جدید ایجاد شد' : 'New operation created',
      message: values.title, isRead: false,
      relatedEntityId: null, relatedEntityType: 'operation',
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); reset(); onClose(); }, 1200);
  };

  return (
    <Dialog open={open} onClose={onClose} title={op.createOperationTitle} description={op.createOperationDesc} size="lg">
      {saved ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-900">{op.successTitle}</p>
          <p className="text-xs text-slate-500 mt-1">{op.successDesc}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit as import('react-hook-form').SubmitHandler<FormValues>)} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <Input label={op.operationTitle} placeholder={op.titlePlaceholder} error={errors.title?.message} {...register('title')} />
          <Textarea label={op.descriptionLabel} rows={3} placeholder={op.descriptionPlaceholder} error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label={op.operationType} error={errors.type?.message} {...register('type')}>
              <option value="">{op.selectType}</option>
              <option value="remove-expired">{op.removeExpired}</option>
              <option value="discount-review">{op.discountReview}</option>
              <option value="priority-shelf">{op.priorityShelf}</option>
              <option value="restock">{op.restock}</option>
              <option value="supplier-review">{op.supplierReview}</option>
              <option value="batch-inspect">{op.batchInspect}</option>
              <option value="manual">{op.manual}</option>
            </Select>
            <Select label={t.common.priority} error={errors.priority?.message} {...register('priority')}>
              <option value="">{op.allPriorities}</option>
              <option value="critical">{op.critical}</option>
              <option value="high">{op.high}</option>
              <option value="medium">{op.medium}</option>
              <option value="low">{op.low}</option>
            </Select>
            <Select label={op.relatedProduct} {...register('productId')}>
              <option value="">{op.noSpecificProduct}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select label={op.assignTo} {...register('assignedUserId')}>
              <option value="">{op.unassigned}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({t.roles[u.role as keyof typeof t.roles] ?? u.role})</option>)}
            </Select>
            <Input label={op.dueDate} type="date" error={errors.dueDate?.message} {...register('dueDate')} />
          </div>
          <Textarea label={op.notesOptional} rows={2} placeholder={op.notesPlaceholder} {...register('notes')} />
          <div className={cn('flex justify-end gap-2 pt-1', isRTL && 'flex-row-reverse')}>
            <Button type="button" variant="secondary" onClick={onClose}>{t.common.cancel}</Button>
            <Button type="submit" isLoading={isSubmitting}>{op.createOperation}</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
