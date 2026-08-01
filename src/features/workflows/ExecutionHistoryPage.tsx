import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, CheckCircle2, XCircle, Zap, Package, Clock, ChevronDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WorkflowExecution } from '@/types';

interface ExecutionHistoryPageProps { onBack: () => void; }

export function ExecutionHistoryPage({ onBack }: ExecutionHistoryPageProps) {
  const { executions } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatNumber, formatDuration } = useLocale();
  const wf = t.workflows;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
        <button onClick={onBack}
          className={cn('flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800', isRTL && 'flex-row-reverse')}>
          <ArrowLeft size={15} className={cn(isRTL && 'rotate-180')} />
          {wf.backToWorkflows}
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className={cn('text-xl font-semibold text-slate-900', isRTL && 'text-right')}>{wf.executionHistoryTitle}</h1>
      </div>

      {executions.length === 0 ? (
        <Card padding="lg">
          <EmptyState icon={<Zap size={28} />} title={wf.noExecutions} description={wf.noExecutionsDesc} />
        </Card>
      ) : (
        <div className="space-y-2">
          {executions.map(exec => (
            <ExecutionCard key={exec.id} execution={exec}
              expanded={expanded === exec.id}
              onToggle={() => setExpanded(expanded === exec.id ? null : exec.id)}
              wf={wf} t={t} formatNumber={formatNumber} formatDuration={formatDuration} isRTL={isRTL} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionCard({ execution, expanded, onToggle, wf, t, formatNumber, formatDuration, isRTL }: {
  execution: WorkflowExecution; expanded: boolean; onToggle: () => void;
  wf: typeof import('@/i18n').en.workflows; t: typeof import('@/i18n').en;
  formatNumber: (n: number) => string; formatDuration: (ms: number | null) => string; isRTL: boolean;
}) {
  const stepIcons = {
    success: <CheckCircle2 size={13} className="text-green-600" />,
    failed:  <XCircle size={13} className="text-red-500" />,
    skipped: <span className="w-3 h-3 rounded-full border-2 border-slate-300 inline-block" />,
  };
  const categoryColors: Record<string, string> = {
    trigger:   'bg-blue-100 text-blue-700',
    condition: 'bg-amber-100 text-amber-700',
    action:    'bg-green-100 text-green-700',
  };

  return (
    <Card padding="none">
      <button onClick={onToggle}
        className={cn('w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50/50 transition-colors', isRTL && 'flex-row-reverse text-right')}>
        {execution.status === 'completed' ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          : execution.status === 'failed' ? <XCircle size={16} className="text-red-500 flex-shrink-0" />
          : <Zap size={16} className="text-blue-500 flex-shrink-0" />}
        <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <span className="text-sm font-medium text-slate-900">{execution.workflowName}</span>
            <Badge variant={execution.status === 'completed' ? 'success' : execution.status === 'failed' ? 'danger' : 'info'} size="sm">
              {execution.status}
            </Badge>
          </div>
          <div className={cn('flex items-center gap-3 mt-0.5 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
            {execution.relatedProductName && (
              <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                <Package size={10} />{execution.relatedProductName}
              </span>
            )}
            <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
              <Clock size={10} />{formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
            </span>
            <span>{formatNumber(execution.steps.length)} {wf.steps}</span>
            {execution.createdOperationIds.length > 0 && (
              <span className="text-green-600">{formatNumber(execution.createdOperationIds.length)} {wf.operationsCreatedLabel}</span>
            )}
            {execution.durationMs !== null && <span>{formatDuration(execution.durationMs)}</span>}
          </div>
        </div>
        <ChevronDown size={14} className={cn('text-slate-400 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {/* Explanation box */}
          <div className={cn('bg-slate-50 rounded-lg p-3 mt-3 mb-3', isRTL && 'text-right')}>
            <p className="text-xs font-semibold text-slate-700 mb-1">{wf.whyTriggered}</p>
            <p className="text-xs text-slate-600">
              {isRTL ? 'گردش‌کار' : 'Workflow'} <strong>{execution.workflowName}</strong>{' '}
              {wf.triggeredBy} <strong>{execution.trigger}</strong>
              {execution.relatedProductName && <> {wf.forProduct} <strong>{execution.relatedProductName}</strong></>}.
              {execution.createdOperationIds.length > 0 && (
                <> {formatNumber(execution.createdOperationIds.length)} {wf.operationsCreatedLabel}.</>
              )}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {execution.steps.map((step, idx) => (
              <div key={step.id} className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">{stepIcons[step.status]}</div>
                  {idx < execution.steps.length - 1 && <div className="w-px h-4 bg-slate-200 mt-1" />}
                </div>
                <div className={cn('flex-1 pb-1', isRTL && 'text-right')}>
                  <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
                    <span className={cn('text-[10px] font-medium rounded px-1.5 py-0.5', categoryColors[step.category] ?? 'bg-slate-100 text-slate-600')}>
                      {step.category}
                    </span>
                    <span className="text-xs font-medium text-slate-800">{step.nodeLabel}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.message}</p>
                  <p className="text-[10px] text-slate-400">{format(new Date(step.timestamp), 'HH:mm:ss.SSS')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
