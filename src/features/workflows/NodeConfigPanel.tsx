import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types';
import { getNodeDef } from './nodeDefinitions';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryColors = {
  trigger:   'text-blue-700 bg-blue-50 border-blue-200',
  condition: 'text-amber-700 bg-amber-50 border-amber-200',
  action:    'text-green-700 bg-green-50 border-green-200',
};

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (config: Record<string, unknown>, label?: string) => void;
  onDelete: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  const { t, isRTL } = useTranslation();
  const wf = t.workflows;
  const data = node.data as unknown as WorkflowNodeData;
  const def = getNodeDef(data.nodeType);
  if (!def) return null;

  function handleFieldChange(key: string, value: string | number | boolean) {
    onUpdate({ ...data.config, [key]: value });
  }

  return (
    <div className={cn('w-60 flex-shrink-0 bg-white overflow-y-auto', isRTL ? 'border-r border-slate-200' : 'border-l border-slate-200')}>
      <div className={cn('px-4 py-3 border-b border-slate-100', isRTL && 'text-right')}>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Settings size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">{wf.nodeConfig}</p>
        </div>
      </div>

      <div className={cn('p-4 space-y-4', isRTL && 'text-right')}>
        <div>
          <span className={cn('inline-flex items-center text-[10px] font-semibold uppercase tracking-wide border rounded px-1.5 py-0.5', categoryColors[data.category])}>
            {data.category}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 mt-1.5">{data.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{data.description}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">{wf.nodeLabel}</label>
          <input type="text" value={data.label} dir={isRTL ? 'rtl' : 'ltr'}
            onChange={e => onUpdate(data.config, e.target.value)}
            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>

        {def.configFields && def.configFields.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{wf.configuration}</p>
            {def.configFields.map(field => (
              <div key={field.key}>
                {field.type === 'select' ? (
                  <Select label={field.label} value={String(data.config[field.key] ?? '')}
                    onChange={e => handleFieldChange(field.key, e.target.value)} dir={isRTL ? 'rtl' : 'ltr'}>
                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                ) : field.type === 'boolean' ? (
                  <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <input type="checkbox" id={field.key}
                      checked={Boolean(data.config[field.key])}
                      onChange={e => handleFieldChange(field.key, e.target.checked)}
                      className="rounded border-slate-300 text-green-600" />
                    <label htmlFor={field.key} className="text-xs font-medium text-slate-700">{field.label}</label>
                  </div>
                ) : (
                  <Input label={field.label} type={field.type === 'number' ? 'number' : 'text'}
                    value={String(data.config[field.key] ?? '')}
                    onChange={e => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
        )}

        {(!def.configFields || def.configFields.length === 0) && (
          <div className="text-center py-4 text-xs text-slate-400">{wf.noConfig}</div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <Button variant="danger" size="sm" className="w-full" leftIcon={<Trash2 size={13} />} onClick={onDelete}>
            {wf.deleteNode}
          </Button>
        </div>
      </div>
    </div>
  );
}
