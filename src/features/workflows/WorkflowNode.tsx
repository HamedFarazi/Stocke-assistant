import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '@/types';
import { useLanguageStore } from '@/stores/languageStore';
import {
  Zap, GitBranch, CheckSquare, Clock, Bell, AlertTriangle, Package,
  Tag, ShoppingCart, Activity, RefreshCcw, PlayCircle, BarChart2,
} from 'lucide-react';

// ── Persian label/description map ────────────────────────────────────────────
const FA_NODE_TEXT: Record<string, { label: string; desc: string }> = {
  'product-sold':              { label: 'محصول فروخته شد',         desc: 'هنگام فروش یک واحد محصول' },
  'new-product-added':         { label: 'محصول جدید اضافه شد',      desc: 'هنگام اضافه شدن دسته جدید' },
  'inventory-updated':         { label: 'موجودی به‌روز شد',         desc: 'هنگام تغییر تعداد موجودی' },
  'expiry-approaching':        { label: 'انقضا نزدیک است',           desc: 'دسته به تاریخ انقضا نزدیک می‌شود' },
  'product-expired':           { label: 'محصول منقضی شد',            desc: 'دسته از تاریخ انقضا گذشته' },
  'low-stock-detected':        { label: 'موجودی کم',                 desc: 'موجودی زیر حداقل رسیده' },
  'scheduled-time':            { label: 'زمان‌بندی شده',              desc: 'در زمان مشخص اجرا می‌شود' },
  'manual-trigger':            { label: 'اجرای دستی',                 desc: 'اجرای دستی گردش‌کار' },
  'days-until-expiry':         { label: 'روز تا انقضا',               desc: 'بررسی تعداد روز تا انقضا' },
  'stock-quantity':            { label: 'تعداد موجودی',               desc: 'بررسی شرط تعداد موجودی' },
  'product-category':          { label: 'دسته‌بندی محصول',            desc: 'بررسی دسته‌بندی محصول' },
  'inventory-value':           { label: 'ارزش موجودی',                desc: 'بررسی ارزش موجودی در معرض خطر' },
  'product-status':            { label: 'وضعیت محصول',                desc: 'بررسی وضعیت محصول یا دسته' },
  'supplier':                  { label: 'تأمین‌کننده',                 desc: 'بررسی تأمین‌کننده محصول' },
  'location':                  { label: 'مکان نگهداری',               desc: 'بررسی مکان نگهداری محصول' },
  'create-operation':          { label: 'ایجاد عملیات',               desc: 'ایجاد وظیفه عملیاتی جدید' },
  'send-notification':         { label: 'ارسال اعلان',                 desc: 'ارسال اعلان درون‌برنامه‌ای' },
  'mark-expired':              { label: 'علامت‌گذاری منقضی',           desc: 'تغییر وضعیت دسته به منقضی' },
  'suggest-discount':          { label: 'پیشنهاد تخفیف',              desc: 'علامت‌گذاری برای بررسی تخفیف' },
  'create-purchase-request':   { label: 'درخواست خرید',               desc: 'ایجاد درخواست خرید برای موجودی کم' },
  'assign-operation':          { label: 'تخصیص عملیات',               desc: 'تخصیص عملیات به عضو تیم' },
  'update-product-status':     { label: 'به‌روزرسانی وضعیت',          desc: 'تغییر وضعیت محصول یا دسته' },
  'add-activity-log':          { label: 'ثبت در فعالیت‌ها',           desc: 'ثبت رویداد در تایم‌لاین' },
};

// ── Category header translations ─────────────────────────────────────────────
const FA_CATEGORY: Record<string, string> = {
  trigger:   'محرک',
  condition: 'شرط',
  action:    'اقدام',
};

const categoryConfig = {
  trigger:   { bg: 'bg-blue-50',   border: 'border-blue-200',   headerBg: 'bg-blue-600',  handleColor: '#3b82f6' },
  condition: { bg: 'bg-amber-50',  border: 'border-amber-200',  headerBg: 'bg-amber-500', handleColor: '#f59e0b' },
  action:    { bg: 'bg-green-50',  border: 'border-green-200',  headerBg: 'bg-green-700', handleColor: '#15803d' },
};

const executionStateRing: Record<string, string> = {
  running: 'ring-2 ring-blue-400 ring-offset-1',
  success: 'ring-2 ring-green-500 ring-offset-1',
  failed:  'ring-2 ring-red-500 ring-offset-1',
  skipped: 'opacity-50',
  idle:    '',
};

function getNodeIcon(nodeType: string) {
  const icons: Record<string, React.ReactNode> = {
    'expiry-approaching':       <AlertTriangle size={12} />,
    'product-expired':          <AlertTriangle size={12} />,
    'low-stock-detected':       <Package size={12} />,
    'product-sold':             <ShoppingCart size={12} />,
    'new-product-added':        <Package size={12} />,
    'inventory-updated':        <RefreshCcw size={12} />,
    'scheduled-time':           <Clock size={12} />,
    'manual-trigger':           <PlayCircle size={12} />,
    'days-until-expiry':        <Clock size={12} />,
    'stock-quantity':           <BarChart2 size={12} />,
    'product-category':         <Tag size={12} />,
    'inventory-value':          <Activity size={12} />,
    'product-status':           <CheckSquare size={12} />,
    'create-operation':         <CheckSquare size={12} />,
    'send-notification':        <Bell size={12} />,
    'mark-expired':             <AlertTriangle size={12} />,
    'suggest-discount':         <Tag size={12} />,
    'create-purchase-request':  <ShoppingCart size={12} />,
    'add-activity-log':         <Activity size={12} />,
  };
  return icons[nodeType] ?? <Zap size={12} />;
}

export function WorkflowNodeComponent({ data, selected }: NodeProps & { data: WorkflowNodeData }) {
  const { language } = useLanguageStore();
  const isFa = language === 'fa';

  const cfg   = categoryConfig[data.category] ?? categoryConfig.action;
  const state = data.executionState ?? 'idle';
  const ring  = executionStateRing[state] ?? '';

  // Use FA text if available
  const displayLabel = isFa && FA_NODE_TEXT[data.nodeType]
    ? FA_NODE_TEXT[data.nodeType].label
    : data.label;
  const displayDesc = isFa && FA_NODE_TEXT[data.nodeType]
    ? FA_NODE_TEXT[data.nodeType].desc
    : data.description;
  const categoryLabel = isFa
    ? (FA_CATEGORY[data.category] ?? data.category)
    : data.category;

  return (
    <div
      className={cn(
        'min-w-[180px] max-w-[220px] rounded-lg border shadow-sm transition-all cursor-pointer',
        cfg.bg, cfg.border,
        selected && 'ring-2 ring-offset-1 ring-slate-400',
        ring
      )}
      dir="ltr"  // canvas nodes always LTR for layout correctness
    >
      {/* Input handle — conditions & actions */}
      {data.category !== 'trigger' && (
        <Handle type="target" position={Position.Top}
          style={{ background: cfg.handleColor, width: 8, height: 8, border: '2px solid white' }} />
      )}

      {/* Header */}
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-white text-[10px] font-medium uppercase tracking-wide',
        cfg.headerBg
      )}>
        {getNodeIcon(data.nodeType)}
        <span>{categoryLabel}</span>
        {state === 'running' && (
          <span className="ml-auto">
            <svg className="animate-spin w-2.5 h-2.5" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
          </span>
        )}
        {state === 'success' && <span className="ml-auto">✓</span>}
        {state === 'failed'  && <span className="ml-auto">✗</span>}
        {state === 'skipped' && <span className="ml-auto text-white/60">—</span>}
      </div>

      {/* Body */}
      <div className="px-2.5 py-2" dir={isFa ? 'rtl' : 'ltr'}>
        <p className="text-xs font-semibold text-slate-900 leading-tight">{displayLabel}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{displayDesc}</p>
        {Object.keys(data.config).length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/70" dir="ltr">
            {Object.entries(data.config).slice(0, 2).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="text-slate-400">{k}:</span>
                <span className="text-slate-700 font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom}
        style={{ background: cfg.handleColor, width: 8, height: 8, border: '2px solid white' }} />
    </div>
  );
}
