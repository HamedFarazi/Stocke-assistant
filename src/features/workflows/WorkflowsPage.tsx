import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getStatusColor, cn } from '@/lib/utils';
import { Plus, GitBranch, Play, Pause, ChevronRight, Zap, Clock, BarChart2, Trash2, Wand2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Workflow } from '@/types';
import { WorkflowBuilder } from './WorkflowBuilder';
import { WorkflowTemplateDialog } from './WorkflowTemplateDialog';
import { ExecutionHistoryPage } from './ExecutionHistoryPage';
import { AIWorkflowGenerator } from './AIWorkflowGenerator';

type WorkflowView = 'list' | 'builder' | 'history';

export function WorkflowsPage() {
  const { workflows, activateWorkflow, deactivateWorkflow, deleteWorkflow } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatNumber } = useLocale();
  const wf = t.workflows;

  const [view, setView] = useState<WorkflowView>('list');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [aiGenOpen, setAiGenOpen] = useState(false);

  if (view === 'builder') {
    return (
      <WorkflowBuilder
        workflow={editingWorkflow}
        onBack={() => { setView('list'); setEditingWorkflow(null); }}
      />
    );
  }

  if (view === 'history') {
    return (
      <div className="px-4 sm:px-6 py-5 max-w-screen-2xl mx-auto overflow-y-auto flex-1">
        <ExecutionHistoryPage onBack={() => setView('list')} />
      </div>
    );
  }

  const activeWfs = workflows.filter(w => w.status === 'active');

  return (
    <div className="px-4 sm:px-6 py-5 max-w-screen-2xl mx-auto space-y-5 overflow-y-auto flex-1">
      {/* Header */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{wf.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatNumber(activeWfs.length)} {wf.active} · {formatNumber(workflows.length)} {wf.total}
          </p>
        </div>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Button size="sm" variant="outline" leftIcon={<BarChart2 size={14} />} onClick={() => setView('history')}>
            {wf.executionHistory}
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Wand2 size={14} />} onClick={() => setAiGenOpen(true)}>
            {isRTL ? 'ساخت با AI' : 'AI Generate'}
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setTemplateOpen(true)}>
            {wf.newWorkflow}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: wf.activeWorkflows,    value: formatNumber(activeWfs.length),                                                 color: 'text-green-700' },
          { label: wf.totalExecutions,    value: formatNumber(workflows.reduce((s, w) => s + w.executionCount, 0)),              color: 'text-blue-700' },
          { label: wf.operationsCreated,  value: formatNumber(workflows.reduce((s, w) => s + Math.floor(w.executionCount * 0.85), 0)), color: 'text-slate-700' },
        ].map(s => (
          <Card key={s.label} padding="sm" className={cn('text-center', isRTL && 'text-right')}>
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* List */}
      {workflows.length === 0 ? (
        <Card padding="lg">
          <EmptyState icon={<GitBranch size={28} />} title={wf.noWorkflows} description={wf.noWorkflowsDesc}
            action={<Button onClick={() => setTemplateOpen(true)} leftIcon={<Plus size={14} />}>{wf.createFirst}</Button>} />
        </Card>
      ) : (
        <div className="space-y-2">
          {workflows.map(w => (
            <Card key={w.id} padding="none">
              <div className={cn('flex items-center gap-4 px-4 py-3.5', isRTL && 'flex-row-reverse')}>
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', w.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300')} />
                <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                  <div className={cn('flex items-center gap-2 flex-wrap', isRTL && 'flex-row-reverse')}>
                    <span className="text-sm font-medium text-slate-900">{w.name}</span>
                    <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', getStatusColor(w.status))}>
                      {t.common[w.status as keyof typeof t.common] as string ?? w.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{w.description}</p>
                  <div className={cn('flex items-center gap-3 mt-1 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
                    <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                      <Zap size={10} /> {formatNumber(w.executionCount)} {wf.executions}
                    </span>
                    {w.lastExecutedAt && (
                      <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                        <Clock size={10} /> {wf.lastRun} {formatDistanceToNow(new Date(w.lastExecutedAt), { addSuffix: true })}
                      </span>
                    )}
                    <span>{formatNumber(w.nodes.length)} {wf.nodes}</span>
                  </div>
                </div>
                <div className={cn('flex items-center gap-1.5 flex-shrink-0', isRTL && 'flex-row-reverse')}>
                  {w.status === 'active' ? (
                    <Button size="xs" variant="outline" leftIcon={<Pause size={11} />} onClick={() => deactivateWorkflow(w.id)}>
                      {wf.deactivate}
                    </Button>
                  ) : (
                    <Button size="xs" variant="outline" leftIcon={<Play size={11} />} onClick={() => activateWorkflow(w.id)}>
                      {wf.activate}
                    </Button>
                  )}
                  <Button size="xs" variant="secondary"
                    onClick={() => { setEditingWorkflow(w); setView('builder'); }}
                    rightIcon={<ChevronRight size={11} className={cn(isRTL && 'rotate-180')} />}>
                    {t.common.edit}
                  </Button>
                  {confirmDelete === w.id ? (
                    <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                      <Button size="xs" variant="danger" onClick={() => { deleteWorkflow(w.id); setConfirmDelete(null); }}>{t.common.confirm}</Button>
                      <Button size="xs" variant="ghost" onClick={() => setConfirmDelete(null)}>{t.common.cancel}</Button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(w.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      aria-label={t.common.delete}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <WorkflowTemplateDialog
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={(w) => { setEditingWorkflow(w); setTemplateOpen(false); setView('builder'); }}
        onBlank={() => { setEditingWorkflow(null); setTemplateOpen(false); setView('builder'); }}
      />

      <AIWorkflowGenerator
        open={aiGenOpen}
        onClose={() => setAiGenOpen(false)}
        onGenerated={(partial) => {
          setEditingWorkflow(partial as Workflow);
          setAiGenOpen(false);
          setView('builder');
        }}
      />
    </div>
  );
}
