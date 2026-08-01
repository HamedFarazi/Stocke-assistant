import type { ExecutionResult } from './workflowExecutionEngine';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowExecutionPanelProps {
  result: ExecutionResult;
  onClose: () => void;
}

const stepIcons = {
  success: <CheckCircle2 size={14} className="text-green-600" />,
  failed:  <XCircle size={14} className="text-red-500" />,
  skipped: <span className="w-3 h-3 rounded-full border-2 border-slate-300 inline-block" />,
};
const categoryColors: Record<string, string> = {
  trigger:   'bg-blue-100 text-blue-700',
  condition: 'bg-amber-100 text-amber-700',
  action:    'bg-green-100 text-green-700',
};

export function WorkflowExecutionPanel({ result, onClose }: WorkflowExecutionPanelProps) {
  const { t, isRTL } = useTranslation();
  const { formatNumber, formatDuration } = useLocale();
  const wf = t.workflows;
  const { execution, success, message } = result;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'absolute bottom-4 z-50 w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden',
          isRTL ? 'left-4' : 'right-4'
        )}>
        <div className={cn('flex items-center justify-between px-4 py-3', success ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200', isRTL && 'flex-row-reverse')}>
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <Zap size={15} className={success ? 'text-green-600' : 'text-red-500'} />
            <span className="text-sm font-semibold text-slate-900">{wf.testExecution}</span>
            <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800')}>
              {execution.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
            <X size={14} />
          </button>
        </div>

        <div className={cn('px-4 py-2.5 border-b border-slate-100 bg-slate-50/50', isRTL && 'text-right')}>
          <p className="text-xs text-slate-600">{message}</p>
          {execution.relatedProductName && (
            <p className="text-xs text-slate-500 mt-0.5">
              {isRTL ? 'محصول' : 'Product'}: <strong>{execution.relatedProductName}</strong>
            </p>
          )}
          <div className={cn('flex items-center gap-3 mt-1 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
            <span>{format(new Date(execution.startedAt), 'HH:mm:ss')}</span>
            {execution.durationMs !== null && <span>{formatDuration(execution.durationMs)}</span>}
            {execution.createdOperationIds.length > 0 && (
              <span className="text-green-600">
                {formatNumber(execution.createdOperationIds.length)} {wf.operationsCreatedLabel}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {execution.steps.map((step, idx) => (
            <motion.div key={step.id}
              initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={cn('flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-50', isRTL && 'flex-row-reverse')}>
              <div className="mt-0.5 flex-shrink-0">{stepIcons[step.status]}</div>
              <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
                  <span className={cn('text-[10px] font-medium uppercase rounded px-1 py-0.5', categoryColors[step.category] ?? 'bg-slate-100 text-slate-600')}>
                    {step.category}
                  </span>
                  <span className="text-xs font-medium text-slate-800">{step.nodeLabel}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.message}</p>
                <p className="text-[10px] text-slate-400">{format(new Date(step.timestamp), 'HH:mm:ss.SSS')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
