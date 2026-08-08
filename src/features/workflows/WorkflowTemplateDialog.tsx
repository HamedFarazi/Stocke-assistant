import { Dialog } from '@/components/ui/Dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { initialWorkflows } from '@/data/workflows';
import type { Workflow } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Zap } from 'lucide-react';

interface WorkflowTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (workflow: Workflow) => void;
  onBlank: () => void;
}

export function WorkflowTemplateDialog({ open, onClose, onSelect, onBlank }: WorkflowTemplateDialogProps) {
  const { t, isRTL } = useTranslation();
  const wf = t.workflows;

  return (
    <Dialog open={open} onClose={onClose} title={wf.createFromTemplate} description={wf.templateDesc} size="lg">
      <div className="space-y-4">
        {/* Blank */}
        <button
          onClick={() => { onBlank(); onClose(); }}
          className={cn('w-full flex items-center gap-3 px-4 py-3 border border-dashed border-slate-300 rounded-lg hover:border-green-400 hover:bg-green-50/30 transition-colors', isRTL && 'flex-row-reverse text-right')}>
          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Plus size={18} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{wf.startFromBlank}</p>
            <p className="text-xs text-slate-500">{wf.blankDesc}</p>
          </div>
        </button>

        <div className={cn('flex items-center gap-2')}>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">{wf.orUseTemplate}</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Templates */}
        <div className="space-y-2">
          {initialWorkflows.map(workflow => (
            <button key={workflow.id}
              onClick={() => {
                const clone: Workflow = { ...workflow, id: '', name: `${workflow.name} (${isRTL ? 'کپی' : 'copy'})`, status: 'draft', executionCount: 0, lastExecutedAt: null };
                onSelect(clone);
                onClose();
              }}
              className={cn('w-full flex items-start gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:border-green-400 hover:bg-green-50/20 transition-colors', isRTL && 'flex-row-reverse text-right')}>
              <div className="w-9 h-9 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={16} className="text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {isRTL && workflow.nameFa ? workflow.nameFa : workflow.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRTL && workflow.descriptionFa ? workflow.descriptionFa : workflow.description}
                </p>
                <div className={cn('flex items-center gap-3 mt-1.5 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
                  <span>{workflow.nodes.filter(n => n.data.category === 'trigger').length} {wf.trigger}</span>
                  <span>{workflow.nodes.filter(n => n.data.category === 'condition').length} {wf.conditions}</span>
                  <span>{workflow.nodes.filter(n => n.data.category === 'action').length} {wf.actions}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
