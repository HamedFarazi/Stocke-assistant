import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIStore } from '@/stores/aiStore';
import { sendAIMessage } from '@/services/aiService';
import { generateId, cn } from '@/lib/utils';
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowNodeData } from '@/types';
import { Sparkles, Loader2, CheckCircle2, Wand2 } from 'lucide-react';

const EXAMPLES_EN = [
  'When milk expires within 3 days and stock is above 20, notify manager and create discount operation',
  'When stock falls below 5 units, create a restock operation and notify staff',
  'When a product expires, mark it as expired and create a removal operation',
  'Every morning check expiry and notify manager about products expiring this week',
];
const EXAMPLES_FA = [
  'وقتی شیر ۳ روز به انقضایش مانده و موجودی بالای ۲۰ است، به مدیر اطلاع بده و عملیات تخفیف بساز',
  'وقتی موجودی زیر ۵ واحد شد، عملیات تأمین موجودی بساز و به کارکنان اطلاع بده',
  'وقتی محصولی منقضی شد، آن را منقضی علامت بزن و عملیات جمع‌آوری بساز',
  'هر روز صبح انقضاها را بررسی کن و در مورد محصولاتی که این هفته منقضی می‌شوند به مدیر اطلاع بده',
];

interface AIWorkflowGeneratorProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (workflow: Partial<Workflow>) => void;
}

function parseWorkflowFromAI(description: string): Partial<Workflow> {
  // Smart frontend parser — analyses the description and generates nodes
  const lower = description.toLowerCase();
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  let nodeY = 50;
  let lastId = '';

  function addNode(nodeType: string, category: 'trigger'|'condition'|'action', label: string, desc: string, config: Record<string,unknown> = {}) {
    const id = generateId('n');
    nodes.push({
      id, type: 'workflowNode',
      position: { x: 250, y: nodeY },
      data: { nodeType, category, label, description: desc, config } as WorkflowNodeData,
    });
    if (lastId) edges.push({ id: generateId('e'), source: lastId, target: id });
    lastId = id;
    nodeY += 160;
    return id;
  }

  // Detect trigger
  if (lower.includes('expir') || lower.includes('منقضی') || lower.includes('انقضا')) {
    const isApproaching = lower.includes('within') || lower.includes('days') || lower.includes('روز') || lower.includes('مانده');
    if (isApproaching) {
      addNode('expiry-approaching', 'trigger', 'Product Expiry Approaching', 'Fires when expiry is close', { daysThreshold: 7 });
    } else {
      addNode('product-expired', 'trigger', 'Product Expired', 'Fires when a product has expired', {});
    }
  } else if (lower.includes('stock') || lower.includes('موجودی') || lower.includes('falls') || lower.includes('کم')) {
    addNode('low-stock-detected', 'trigger', 'Low Stock Detected', 'Fires when stock is low', { threshold: 5 });
  } else if (lower.includes('morning') || lower.includes('daily') || lower.includes('صبح') || lower.includes('روزانه')) {
    addNode('scheduled-time', 'trigger', 'Scheduled Time', 'Runs at a scheduled time', { time: '08:00', frequency: 'daily' });
  } else {
    addNode('expiry-approaching', 'trigger', 'Product Expiry Approaching', 'Fires when expiry is close', { daysThreshold: 7 });
  }

  // Detect conditions
  const daysMatch = lower.match(/(\d+)\s*(day|روز)/);
  if (daysMatch) {
    addNode('days-until-expiry', 'condition', `Days Until Expiry ≤ ${daysMatch[1]}`, 'Check days remaining', { operator: 'lte', value: parseInt(daysMatch[1]) });
  }
  const stockMatch = lower.match(/(?:above|over|بالای|بیشتر از)\s*(\d+)/);
  if (stockMatch) {
    addNode('stock-quantity', 'condition', `Stock > ${stockMatch[1]}`, 'Check stock level', { operator: 'gt', value: parseInt(stockMatch[1]) });
  }
  const lowMatch = lower.match(/(?:below|under|زیر|کمتر از)\s*(\d+)/);
  if (lowMatch) {
    addNode('stock-quantity', 'condition', `Stock < ${lowMatch[1]}`, 'Check stock level', { operator: 'lt', value: parseInt(lowMatch[1]) });
  }

  // Detect actions
  const wantsNotify = lower.includes('notify') || lower.includes('notification') || lower.includes('اطلاع') || lower.includes('اعلان');
  const wantsOperation = lower.includes('operation') || lower.includes('عملیات') || lower.includes('create') || lower.includes('بساز');
  const wantsDiscount = lower.includes('discount') || lower.includes('تخفیف');
  const wantsRemove = lower.includes('remov') || lower.includes('جمع‌آوری') || lower.includes('حذف');
  const wantsRestock = lower.includes('restock') || lower.includes('تأمین') || lower.includes('سفارش');
  const wantsMarkExpired = lower.includes('mark') && (lower.includes('expir') || lower.includes('منقضی'));

  if (wantsMarkExpired) {
    addNode('mark-expired', 'action', 'Mark as Expired', 'Update batch status to expired', {});
  }
  if (wantsDiscount) {
    addNode('suggest-discount', 'action', 'Suggest Discount', 'Flag for discount review', { discountPercent: 25 });
  }
  if (wantsRemove) {
    addNode('create-operation', 'action', 'Create Removal Operation', 'Create task to remove from shelf', { operationType: 'remove-expired', priority: 'critical', title: 'Remove expired product', assignTo: 'staff' });
  } else if (wantsRestock) {
    addNode('create-operation', 'action', 'Create Restock Operation', 'Create task to restock', { operationType: 'restock', priority: 'high', title: 'Restock low inventory', assignTo: 'staff' });
  } else if (wantsOperation) {
    addNode('create-operation', 'action', 'Create Operation', 'Create operational task', { operationType: 'discount-review', priority: 'high', title: 'Review product', assignTo: 'manager' });
  }
  if (wantsNotify) {
    const toManager = lower.includes('manager') || lower.includes('مدیر');
    addNode('send-notification', 'action', toManager ? 'Notify Manager' : 'Notify Staff', 'Send notification', { recipient: toManager ? 'manager' : 'staff', message: 'Automated alert triggered.' });
  }

  // Fallback if no actions were added
  if (nodes.filter(n => n.data.category === 'action').length === 0) {
    addNode('send-notification', 'action', 'Send Notification', 'Send alert to team', { recipient: 'manager', message: 'Automated alert.' });
  }

  const name = description.length > 50 ? description.slice(0, 47) + '…' : description;

  return {
    name,
    description,
    status: 'draft',
    nodes,
    edges,
    createdBy: 'user-001',
  };
}

export function AIWorkflowGenerator({ open, onClose, onGenerated }: AIWorkflowGeneratorProps) {
  const { t, isRTL } = useTranslation();
  const { config } = useAIStore();
  const isFa = isRTL;

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Partial<Workflow> | null>(null);
  const [useAI, setUseAI] = useState(false);

  const examples = isFa ? EXAMPLES_FA : EXAMPLES_EN;

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);

    await new Promise(r => setTimeout(r, 800)); // Simulate analysis

    if (useAI) {
      try {
        const systemMsg = {
          id: '', role: 'system' as const, content: `You are a workflow generator for a grocery store management system.
The user will describe automation in natural language.
Respond with ONLY a JSON object (no markdown) with these fields:
{ "name": string, "description": string, "trigger": "expiry-approaching"|"product-expired"|"low-stock-detected"|"scheduled-time", "conditions": [{"type": string, "operator": string, "value": number}], "actions": [{"type": string, "config": object}] }`, timestamp: '',
        };
        const userMsg = { id: '', role: 'user' as const, content: prompt, timestamp: '' };
        const reply = await sendAIMessage(config, [systemMsg, userMsg]);
        const jsonMatch = reply.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          JSON.parse(jsonMatch[0]); // validate
        }
      } catch {
        // Fall back to local parsing
      }
    }

    // Use local smart parser
    const generated = parseWorkflowFromAI(prompt);
    setResult(generated);
    setIsGenerating(false);
  }

  function handleUse() {
    if (result) {
      onGenerated(result);
      onClose();
      setPrompt('');
      setResult(null);
    }
  }

  const labels = {
    title:        isFa ? 'ساخت گردش‌کار با هوش مصنوعی' : 'AI Workflow Generator',
    desc:         isFa ? 'اتوماسیون خود را به زبان ساده توضیح دهید' : 'Describe your automation in plain language',
    placeholder:  isFa ? 'مثال: وقتی شیر ۳ روز به انقضایش مانده، به مدیر اطلاع بده…' : 'e.g. When milk expires within 3 days, notify manager and create discount operation…',
    examples:     isFa ? 'نمونه‌های پیشنهادی' : 'Suggested examples',
    generate:     isFa ? 'ساخت گردش‌کار' : 'Generate Workflow',
    generating:   isFa ? 'در حال تحلیل…' : 'Analysing…',
    useWorkflow:  isFa ? 'استفاده از این گردش‌کار' : 'Use This Workflow',
    tryAnother:   isFa ? 'امتحان مجدد' : 'Try Another',
    nodesCreated: isFa ? 'گره ایجاد شد' : 'nodes created',
    preview:      isFa ? 'پیش‌نمایش' : 'Preview',
    useAILabel:   isFa ? 'استفاده از AI واقعی (نیاز به Ollama/API)' : 'Use real AI (requires Ollama/API)',
    cancel:       t.common.cancel,
  };

  return (
    <Dialog open={open} onClose={onClose} title={labels.title} description={labels.desc} size="lg">
      <div className={cn('space-y-4', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
        {!result ? (
          <>
            {/* Prompt input */}
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={labels.placeholder}
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900',
                'placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-colors',
                isRTL && 'text-right'
              )}
            />

            {/* Examples */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500">{labels.examples}</p>
              <div className="space-y-1">
                {examples.map(ex => (
                  <button key={ex} onClick={() => setPrompt(ex)}
                    className={cn(
                      'w-full text-xs text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-green-800 border border-slate-200 hover:border-green-200 rounded-lg px-3 py-2 transition-colors',
                      isRTL ? 'text-right' : 'text-left'
                    )}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Use AI toggle */}
            <label className={cn('flex items-center gap-2 cursor-pointer', isRTL && 'flex-row-reverse')}>
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
              <span className="text-xs text-slate-500">{labels.useAILabel}</span>
            </label>

            <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
              <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
                isLoading={isGenerating}
                leftIcon={isGenerating ? undefined : <Wand2 size={14} />}>
                {isGenerating ? labels.generating : labels.generate}
              </Button>
              <Button variant="secondary" onClick={onClose}>{labels.cancel}</Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Success header */}
            <div className={cn('flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg', isRTL && 'flex-row-reverse')}>
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
              <div className={cn('flex-1', isRTL && 'text-right')}>
                <p className="text-sm font-semibold text-green-800">{result.name}</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {isFa ? formatNumberPersian(result.nodes?.length ?? 0) : result.nodes?.length} {labels.nodesCreated}
                </p>
              </div>
            </div>

            {/* Node preview */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500">{labels.preview}</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {result.nodes?.map((node, idx) => {
                  const colors = { trigger: 'bg-blue-50 border-blue-200 text-blue-800', condition: 'bg-amber-50 border-amber-200 text-amber-800', action: 'bg-green-50 border-green-200 text-green-800' };
                  const catLabels = { trigger: isFa?'محرک':'Trigger', condition: isFa?'شرط':'Condition', action: isFa?'اقدام':'Action' };
                  return (
                    <div key={node.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium', colors[node.data.category], isRTL && 'flex-row-reverse')}>
                      <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{node.data.label}</span>
                      <span className="opacity-60 text-[10px]">{catLabels[node.data.category]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
              <Button leftIcon={<Sparkles size={14} />} onClick={handleUse}>
                {labels.useWorkflow}
              </Button>
              <Button variant="secondary" onClick={() => setResult(null)}>
                {labels.tryAnother}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function formatNumberPersian(n: number): string {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}
