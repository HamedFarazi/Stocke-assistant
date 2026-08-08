import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Send, User, Calendar, Flag, MessageSquare } from 'lucide-react';
import type { OperationPriority } from '@/types';

interface AssignTaskDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  itemType: 'operation' | 'purchase-request';
  itemId: string;
  currentAssigneeId?: string | null;
  currentDueDate?: string;
  currentPriority?: OperationPriority;
  onSuccess?: () => void;
}

// Official SVG Logos
const TelegramLogo = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const BaleLogo = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" className="opacity-20" />
    <path d="M7 8.5C7 7.67 7.67 7 8.5 7h7c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5H12l-3.5 3v-3H8.5C7.67 14 7 13.33 7 12.5v-4z" />
    <circle cx="10" cy="10.5" r="1" />
    <circle cx="14" cy="10.5" r="1" />
  </svg>
);

const OutlookLogo = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M1 17.5l9 3.5V3L1 6.5v11zm11 2.5l11-2V6l-11-2v16zM15 9h5v1.5h-5V9zm0 3h5v1.5h-5V12zm0 3h5v1.5h-5V15z" />
  </svg>
);

export function AssignTaskDialog({
  open,
  onClose,
  title,
  itemType,
  itemId,
  currentAssigneeId,
  currentDueDate,
  currentPriority = 'medium',
  onSuccess,
}: AssignTaskDialogProps) {
  const { users } = useSettingsStore();
  const { updateOperation, updatePurchaseRequest, addActivity, addNotification, currentUserId } = useAppStore();
  const { t, isRTL, language } = useTranslation();
  const isFa = language === 'fa';

  const [assignedUserId, setAssignedUserId] = useState(currentAssigneeId ?? users[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(currentDueDate ? currentDueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<OperationPriority>(currentPriority);
  const [comment, setComment] = useState('');
  const [sharingPlatform, setSharingPlatform] = useState<'telegram' | 'bale' | 'outlook' | null>(null);
  const [shareStep, setShareStep] = useState<'idle' | 'preparing' | 'sent'>('idle');

  const selectedUser = users.find(u => u.id === assignedUserId);

  async function handleAssign(platform?: 'telegram' | 'bale' | 'outlook') {
    if (platform) {
      setSharingPlatform(platform);
      setShareStep('preparing');
      await new Promise(r => setTimeout(r, 1200));
      setShareStep('sent');
      await new Promise(r => setTimeout(r, 1000));
    }

    const assigneeName = selectedUser?.name ?? 'Staff';

    if (itemType === 'operation') {
      updateOperation(itemId, {
        assignedUserId,
        dueDate: new Date(dueDate).toISOString(),
        priority,
        notes: comment ? comment : undefined,
      });
    } else {
      updatePurchaseRequest(itemId, {
        assignee: assigneeName,
        expectedDelivery: new Date(dueDate).toISOString(),
        priority,
      });
    }

    addNotification({
      type: 'operation-assigned',
      title: isFa ? `وظیفه جدید تخصیص داده شد` : `Task assigned to ${assigneeName}`,
      message: `${title} · ${isFa ? 'ارسال شده از طریق' : 'Shared via'} ${platform ?? 'system'}`,
      isRead: false,
      relatedEntityId: itemId,
      relatedEntityType: itemType === 'operation' ? 'operation' : 'product',
    });

    addActivity({
      type: 'operation-created',
      title: isFa ? `تخصیص وظیفه به ${assigneeName}` : `Task assigned to ${assigneeName}`,
      description: `${title} (${platform ? `Sent via ${platform}` : 'Assigned in app'})`,
      actorId: currentUserId,
      actorName: 'Manager',
      relatedEntityId: itemId,
      relatedEntityType: itemType === 'operation' ? 'operation' : 'product',
      relatedEntityName: title,
    });

    setShareStep('idle');
    setSharingPlatform(null);
    onSuccess?.();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={isFa ? 'تخصیص وظیفه' : 'Assign Task'}>
      <div className={cn('space-y-4 pt-2', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {isFa ? 'عنوان آیتم' : 'Item Title'}
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">{title}</p>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              {isFa ? 'تخصیص به' : 'Assign To'}
            </label>
            <Select
              value={assignedUserId}
              onChange={e => setAssignedUserId(e.target.value)}
              className="w-full text-xs"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                {isFa ? 'مهلت انجام' : 'Due Date'}
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                {isFa ? 'اولویت' : 'Priority'}
              </label>
              <Select
                value={priority}
                onChange={e => setPriority(e.target.value as OperationPriority)}
                className="w-full text-xs"
              >
                <option value="low">{isFa ? 'پایین' : 'Low'}</option>
                <option value="medium">{isFa ? 'متوسط' : 'Medium'}</option>
                <option value="high">{isFa ? 'بالا' : 'High'}</option>
                <option value="critical">{isFa ? 'بحرانی' : 'Critical'}</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              {isFa ? 'توضیحات / کامنت' : 'Comment / Note'}
            </label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={isFa ? 'توضیحات اضافی برای مسئول انجام…' : 'Add instructions for assignee…'}
              rows={2}
              className="text-xs"
            />
          </div>
        </div>

        {/* Share & Dispatch simulation */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            {isFa ? 'اشتراک‌گذاری و ارسال فوری:' : 'Share & Notify via Platform:'}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={shareStep !== 'idle'}
              onClick={() => handleAssign('telegram')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-sky-700 transition-all font-medium text-xs disabled:opacity-50"
            >
              <TelegramLogo />
              <span>Telegram</span>
            </button>

            <button
              type="button"
              disabled={shareStep !== 'idle'}
              onClick={() => handleAssign('bale')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-100 text-green-700 transition-all font-medium text-xs disabled:opacity-50"
            >
              <BaleLogo />
              <span>Bale</span>
            </button>

            <button
              type="button"
              disabled={shareStep !== 'idle'}
              onClick={() => handleAssign('outlook')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 transition-all font-medium text-xs disabled:opacity-50"
            >
              <OutlookLogo />
              <span>Outlook</span>
            </button>
          </div>

          <AnimatePresence>
            {shareStep !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-center gap-2 text-xs"
              >
                {shareStep === 'preparing' ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-green-400" />
                    <span>
                      {isFa ? `در حال آماده‌سازی پیام در ${sharingPlatform}…` : `Preparing message on ${sharingPlatform}…`}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>
                      {isFa ? `وظیفه با موفقیت در ${sharingPlatform} ارسال شد!` : `Task shared successfully via ${sharingPlatform}!`}
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Regular Save / Cancel */}
        <div className={cn('flex justify-end gap-2 pt-3 border-t border-slate-100', isRTL && 'flex-row-reverse')}>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={() => handleAssign()}>
            {isFa ? 'تخصیص در سیستم' : 'Assign in System'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
