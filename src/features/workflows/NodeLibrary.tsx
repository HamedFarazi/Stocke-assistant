import { useState } from 'react';
import { triggerNodes, conditionNodes, actionNodes } from './nodeDefinitions';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/stores/languageStore';
import { cn, generateId } from '@/lib/utils';
import { Zap, GitBranch, CheckSquare, ChevronDown, Plus } from 'lucide-react';
import type { NodeDef } from './nodeDefinitions';
import type { NodeCategory } from '@/types';

// ── Persian translations for node labels/descriptions ──────────────────────
const FA_NODES: Record<string, { label: string; description: string }> = {
  // Triggers
  'product-sold':       { label: 'محصول فروخته شد',      description: 'هنگام فروش یک واحد محصول اجرا می‌شود' },
  'new-product-added':  { label: 'محصول جدید اضافه شد',   description: 'هنگام اضافه شدن محصول یا دسته جدید اجرا می‌شود' },
  'inventory-updated':  { label: 'موجودی به‌روز شد',      description: 'هنگام تغییر تعداد موجودی اجرا می‌شود' },
  'expiry-approaching': { label: 'انقضا نزدیک است',        description: 'هنگامی که دسته به تاریخ انقضا نزدیک می‌شود' },
  'product-expired':    { label: 'محصول منقضی شد',         description: 'هنگامی که دسته از تاریخ انقضا می‌گذرد' },
  'low-stock-detected': { label: 'موجودی کم شناسایی شد',   description: 'هنگامی که موجودی زیر حداقل می‌رسد' },
  'scheduled-time':     { label: 'زمان‌بندی شده',           description: 'در یک زمان مشخص هر روز یا هفته اجرا می‌شود' },
  'manual-trigger':     { label: 'اجرای دستی',              description: 'این گردش‌کار را به‌صورت دستی اجرا کنید' },
  // Conditions
  'days-until-expiry':  { label: 'روزهای تا انقضا',        description: 'بررسی تعداد روز تا انقضای دسته' },
  'stock-quantity':     { label: 'تعداد موجودی',            description: 'بررسی اینکه موجودی یک شرط تعداد را برآورده می‌کند' },
  'product-category':   { label: 'دسته‌بندی محصول',        description: 'بررسی اینکه محصول به یک دسته خاص تعلق دارد' },
  'inventory-value':    { label: 'ارزش موجودی',             description: 'بررسی اینکه ارزش موجودی از یک حد تجاوز می‌کند' },
  'product-status':     { label: 'وضعیت محصول',             description: 'بررسی وضعیت فعلی محصول یا دسته' },
  'supplier':           { label: 'تأمین‌کننده',              description: 'بررسی اینکه محصول از تأمین‌کننده خاصی است' },
  'location':           { label: 'مکان نگهداری',             description: 'بررسی اینکه محصول در مکان خاصی نگهداری می‌شود' },
  // Actions
  'create-operation':         { label: 'ایجاد عملیات',          description: 'یک وظیفه عملیاتی جدید برای کارکنان ایجاد کنید' },
  'send-notification':        { label: 'ارسال اعلان',            description: 'یک اعلان درون‌برنامه‌ای ارسال کنید' },
  'mark-expired':             { label: 'علامت‌گذاری به عنوان منقضی', description: 'وضعیت دسته را به منقضی تغییر دهید' },
  'suggest-discount':         { label: 'پیشنهاد تخفیف',          description: 'محصول را برای بررسی تخفیف قیمت علامت بزنید' },
  'create-purchase-request':  { label: 'ایجاد درخواست خرید',     description: 'یک درخواست خرید برای محصول کم‌موجود ایجاد کنید' },
  'assign-operation':         { label: 'تخصیص عملیات',           description: 'یک عملیات موجود به عضو تیم تخصیص دهید' },
  'update-product-status':    { label: 'به‌روزرسانی وضعیت محصول', description: 'وضعیت محصول یا دسته را تغییر دهید' },
  'add-activity-log':         { label: 'ثبت در گزارش فعالیت',   description: 'یک رویداد در تایم‌لاین فعالیت ثبت کنید' },
};

function useNodeLabel(node: NodeDef) {
  const { language } = useLanguageStore();
  if (language === 'fa' && FA_NODES[node.type]) {
    return FA_NODES[node.type];
  }
  return { label: node.label, description: node.description };
}

interface CustomNodeEntry { id: string; label: string; description: string; category: NodeCategory }

export function NodeLibrary() {
  const { t, isRTL } = useTranslation();
  const { language } = useLanguageStore();
  const wf = t.workflows;
  const isFa = language === 'fa';

  const [expanded, setExpanded] = useState({ trigger: true, condition: true, action: true });
  const [customNodes, setCustomNodes] = useState<CustomNodeEntry[]>([]);
  const [addingCustom, setAddingCustom] = useState<NodeCategory | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const categories = [
    { id: 'trigger' as NodeCategory,   label: wf.triggers,   icon: <Zap size={13} className="text-blue-500" />,         nodes: triggerNodes,   color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
    { id: 'condition' as NodeCategory, label: wf.conditions,  icon: <GitBranch size={13} className="text-amber-500" />,  nodes: conditionNodes, color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
    { id: 'action' as NodeCategory,    label: wf.actions,     icon: <CheckSquare size={13} className="text-green-600" />, nodes: actionNodes,    color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' },
  ];

  function onDragStart(event: React.DragEvent, nodeType: string) {
    event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }

  function onDragStartCustom(event: React.DragEvent, entry: CustomNodeEntry) {
    const payload = JSON.stringify({
      type: `custom-${entry.id}`,
      label: entry.label,
      description: entry.description,
      category: entry.category,
    });
    event.dataTransfer.setData('application/reactflow-custom', payload);
    event.dataTransfer.effectAllowed = 'move';
  }

  function addCustomNode(category: NodeCategory) {
    if (!customLabel.trim()) return;
    setCustomNodes(prev => [...prev, {
      id: generateId('cn'),
      label: customLabel.trim(),
      description: customDesc.trim() || (isFa ? 'گره سفارشی' : 'Custom node'),
      category,
    }]);
    setCustomLabel('');
    setCustomDesc('');
    setAddingCustom(null);
  }

  return (
    <div className={cn('w-52 flex-shrink-0 bg-white overflow-y-auto', isRTL ? 'border-l border-slate-200' : 'border-r border-slate-200')}>
      <div className={cn('px-3 py-3 border-b border-slate-100', isRTL && 'text-right')}>
        <p className="text-xs font-semibold text-slate-700">{wf.nodeLibrary}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{wf.dragToCanvas}</p>
      </div>

      <div className="py-2 space-y-1">
        {categories.map(cat => (
          <div key={cat.id}>
            {/* Category header */}
            <div className={cn('flex items-center px-3 py-1.5', isRTL && 'flex-row-reverse')}>
              <button
                onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id as keyof typeof e] }))}
                className={cn('flex-1 flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors', isRTL ? 'flex-row-reverse' : '')}
              >
                <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
                  {cat.icon} {cat.label}
                </div>
                <ChevronDown size={11} className={cn('ml-auto transition-transform', isRTL && 'mr-auto ml-0', !expanded[cat.id as keyof typeof expanded] && '-rotate-90')} />
              </button>
              {/* + button for custom node */}
              <button
                onClick={() => { setAddingCustom(cat.id); setCustomLabel(''); setCustomDesc(''); }}
                className="p-0.5 rounded text-slate-300 hover:text-green-600 hover:bg-green-50 transition-colors ml-1"
                title={isFa ? 'افزودن گره سفارشی' : 'Add custom node'}
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Add custom node form */}
            {addingCustom === cat.id && (
              <div className={cn('mx-2 mb-1 p-2 bg-slate-50 border border-slate-200 rounded-md space-y-1.5', isRTL && 'text-right')}>
                <input
                  autoFocus
                  type="text"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  placeholder={isFa ? 'نام گره…' : 'Node name…'}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  onKeyDown={e => { if (e.key === 'Enter') addCustomNode(cat.id); if (e.key === 'Escape') setAddingCustom(null); }}
                />
                <input
                  type="text"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  placeholder={isFa ? 'توضیح (اختیاری)' : 'Description (optional)'}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <div className={cn('flex gap-1', isRTL && 'flex-row-reverse')}>
                  <button onClick={() => addCustomNode(cat.id)}
                    className="flex-1 text-[11px] py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                    {isFa ? 'افزودن' : 'Add'}
                  </button>
                  <button onClick={() => setAddingCustom(null)}
                    className="flex-1 text-[11px] py-0.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors">
                    {isFa ? 'لغو' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* Nodes list */}
            {expanded[cat.id as keyof typeof expanded] && (
              <div className="px-2 pb-1 space-y-1">
                {/* Built-in nodes */}
                {cat.nodes.map(node => {
                  const { label, description } = isFa && FA_NODES[node.type]
                    ? FA_NODES[node.type]
                    : { label: node.label, description: node.description };
                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={e => onDragStart(e, node.type)}
                      className={cn('border rounded-md px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition-colors', cat.color, isRTL && 'text-right')}
                    >
                      <p className="text-[11px] font-semibold">{label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{description}</p>
                    </div>
                  );
                })}

                {/* Custom nodes for this category */}
                {customNodes.filter(c => c.category === cat.id).map(entry => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={e => onDragStartCustom(e, entry)}
                    className={cn('border rounded-md px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition-colors border-dashed', cat.color, isRTL && 'text-right')}
                  >
                    <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                      <p className="text-[11px] font-semibold">{entry.label}</p>
                      <span className="text-[9px] opacity-50">{isFa ? 'سفارشی' : 'custom'}</span>
                    </div>
                    <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{entry.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
