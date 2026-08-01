import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { cn, getPriorityColor, getStatusColor } from '@/lib/utils';
import type { Operation } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, Package, User, GitBranch, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { products } from '@/data/products';
import { useSettingsStore } from '@/stores/settingsStore';

interface OperationDetailDrawerProps {
  operation: Operation;
  open: boolean;
  onClose: () => void;
}

export function OperationDetailDrawer({ operation, open, onClose }: OperationDetailDrawerProps) {
  const { completeOperation, dismissOperation, updateOperation } = useAppStore();
  const { users } = useSettingsStore();
  const { t, isRTL } = useTranslation();
  const { formatDate, formatNumber } = useLocale();
  const op = t.operations;

  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  const product = products.find(p => p.id === operation.productId);
  const assignee = users.find(u => u.id === operation.assignedUserId);

  const statusLabels: Record<string, string> = {
    'pending':     op.pending,
    'in-progress': op.inProgressStatus,
    'completed':   op.completed,
    'dismissed':   op.dismissed,
  };

  async function handleComplete() {
    setCompleting(true);
    await new Promise(r => setTimeout(r, 600));
    completeOperation(operation.id, 'Sarah Mitchell', completeNotes || undefined);
    setCompleting(false);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={operation.title}
      description={formatDistanceToNow(new Date(operation.createdAt), { addSuffix: true })}
      width="w-[480px]"
    >
      <div className={cn('p-5 space-y-5', isRTL && 'text-right')}>
        {/* Completed banner */}
        {operation.status === 'completed' && (
          <div className={cn('bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <CheckCircle2 size={16} className="text-green-600" />
            <div className={cn(isRTL && 'text-right')}>
              <p className="text-xs font-semibold text-green-800">{op.completed}</p>
              {operation.completedAt && (
                <p className="text-xs text-green-600">
                  {op.completedBy} {operation.completedBy} · {formatDate(operation.completedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Priority & Status */}
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1', getPriorityColor(operation.priority))}>
            {t.operations[operation.priority as keyof typeof t.operations] as string ?? operation.priority}
          </span>
          <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1', getStatusColor(operation.status))}>
            {statusLabels[operation.status] ?? operation.status}
          </span>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            {t.common.description}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">{operation.description}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {product && (
            <div className={cn('flex items-center gap-2 bg-slate-50 rounded-md p-2.5', isRTL && 'flex-row-reverse')}>
              <Package size={14} className="text-slate-400" />
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-[10px] text-slate-400">{op.relatedProduct}</p>
                <p className="text-xs font-medium text-slate-800">{product.name}</p>
              </div>
            </div>
          )}
          {assignee && (
            <div className={cn('flex items-center gap-2 bg-slate-50 rounded-md p-2.5', isRTL && 'flex-row-reverse')}>
              <User size={14} className="text-slate-400" />
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-[10px] text-slate-400">{op.assignedTo}</p>
                <p className="text-xs font-medium text-slate-800">{assignee.name}</p>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-2 bg-slate-50 rounded-md p-2.5', isRTL && 'flex-row-reverse')}>
            <Clock size={14} className="text-slate-400" />
            <div className={cn(isRTL && 'text-right')}>
              <p className="text-[10px] text-slate-400">{op.dueDate}</p>
              <p className="text-xs font-medium text-slate-800">{formatDate(operation.dueDate)}</p>
            </div>
          </div>
          {operation.sourceWorkflowName && (
            <div className={cn('flex items-center gap-2 bg-slate-50 rounded-md p-2.5', isRTL && 'flex-row-reverse')}>
              <GitBranch size={14} className="text-slate-400" />
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-[10px] text-slate-400">{op.sourceWorkflow}</p>
                <p className="text-xs font-medium text-slate-800">{operation.sourceWorkflowName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {operation.notes && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t.common.notes}</h3>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-md p-3">{operation.notes}</p>
          </div>
        )}

        {/* Actions */}
        {(operation.status === 'pending' || operation.status === 'in-progress') && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {operation.status === 'pending' && (
              <Button variant="secondary" className="w-full" onClick={() => updateOperation(operation.id, { status: 'in-progress' })}>
                {op.markInProgress}
              </Button>
            )}
            {operation.status === 'in-progress' && (
              <Textarea
                label={op.completionNotes}
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                rows={2}
                placeholder={op.completionNotesPlaceholder}
              />
            )}
            <Button variant="primary" className="w-full" leftIcon={<CheckCircle2 size={15} />} isLoading={completing} onClick={handleComplete}>
              {op.markCompleted}
            </Button>
            {!confirmDismiss ? (
              <Button variant="ghost" className="w-full text-slate-500" onClick={() => setConfirmDismiss(true)}>
                {op.dismissOperation}
              </Button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <AlertTriangle size={14} className="text-red-500" />
                  <p className="text-xs font-medium text-red-800">{op.dismissWarning}</p>
                </div>
                <p className="text-xs text-red-600">{op.dismissDesc}</p>
                <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
                  <Button size="sm" variant="danger" onClick={() => { dismissOperation(operation.id); onClose(); }}>{t.common.confirm}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDismiss(false)}>{t.common.cancel}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
