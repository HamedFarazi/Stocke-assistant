import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Activity, CheckCircle2, AlertTriangle, Package,
  GitBranch, ClipboardList, Zap, ShoppingBag,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ActivityEventType } from '@/types';

// ── Localise hardcoded English strings ───────────────────────────────────────
function localise(text: string, isFa: boolean): string {
  if (!isFa) return text;
  return text
    // titles
    .replace(/workflow completed$/i, 'گردش‌کار تکمیل شد')
    .replace(/workflow triggered$/i, 'گردش‌کار فعال شد')
    .replace(/workflow activated:/i, 'گردش‌کار فعال شد:')
    .replace(/\bworkflow\b/gi, 'گردش‌کار')
    .replace(/\boperation created:/i, 'عملیات ایجاد شد:')
    .replace(/\boperation completed:/i, 'عملیات تکمیل شد:')
    .replace(/operation assigned to store staff/i, 'عملیات به کارکنان فروشگاه تخصیص یافت')
    .replace(/\bnew batch added:/i, 'دسته جدید اضافه شد:')
    .replace(/\bpurchase request created for/i, 'درخواست خرید برای')
    // descriptions
    .replace(/Workflow executed\. (\d+) operation\(s\) created\./gi, (_, n) =>
      n === '0' ? 'گردش‌کار اجرا شد. عملیاتی ایجاد نشد.' : `گردش‌کار اجرا شد. ${toPersian(n)} عملیات ایجاد شد.`
    )
    .replace(/is now active and monitoring for triggers\./i, 'اکنون فعال است و در حال نظارت است.')
    .replace(/was activated by/i, 'توسط')
    .replace(/units disposed/i, 'واحد دور انداخته شد')
    .replace(/completed the removal operation for/i, 'عملیات جمع‌آوری برای')
    .replace(/completed removal of/i, 'جمع‌آوری')
    .replace(/expired.*units from batch/i, 'واحد منقضی از دسته')
    .replace(/has passed its expiry date and was marked expired by the system\./i, 'از تاریخ انقضا گذشته و توسط سیستم منقضی علامت‌گذاری شد.')
    .replace(/assigned to/i, 'تخصیص‌یافته به')
    .replace(/dropped to/i, 'کاهش یافت به')
    .replace(/Restock operation created\./i, 'عملیات تأمین موجودی ایجاد شد.')
    .replace(/Operation created automatically by/i, 'عملیات خودکار توسط')
    .replace(/submitted to/i, 'ارسال شده به')
    .replace(/for urgent.*restock\./i, 'برای تأمین فوری موجودی.')
    .replace(/added\. Expiry: (\d+) days\./i, (_, d) => `اضافه شد. انقضا: ${toPersian(d)} روز.`)
    .replace(/Supplier:/i, 'تأمین‌کننده:');
}

function toPersian(n: string | number): string {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';

export function ActivityPage() {
  const { activities } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatDate } = useLocale();
  const isFa = isRTL;
  const ac = t.activity;
  const [filter, setFilter] = useState('');

  const filtered = filter ? activities.filter(a => a.type === filter) : activities;

  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date))     return t.common.today;
    if (isYesterday(date)) return t.common.yesterday;
    return formatDate(dateStr);
  }

  const grouped = filtered.reduce((acc, event) => {
    const label = getDateLabel(event.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {} as Record<string, typeof activities>);

  type EventCfg = {
    icon: React.ReactNode; bg: string; color: string;
    badgeVariant: 'success'|'danger'|'warning'|'info'|'default'; label: string;
  };

  const eventConfig: Record<ActivityEventType, EventCfg> = {
    'product-added':             { icon: <Package size={13}/>,      bg:'bg-blue-100',   color:'text-blue-600',   badgeVariant:'info',    label: isFa?'محصول اضافه شد':'Product Added' },
    'batch-added':               { icon: <Package size={13}/>,      bg:'bg-blue-100',   color:'text-blue-600',   badgeVariant:'info',    label: isFa?'دسته اضافه شد':'Batch Added' },
    'product-expired':           { icon: <AlertTriangle size={13}/>,bg:'bg-red-100',    color:'text-red-600',    badgeVariant:'danger',  label: isFa?'محصول منقضی شد':'Product Expired' },
    'operation-created':         { icon: <ClipboardList size={13}/>,bg:'bg-amber-100',  color:'text-amber-600',  badgeVariant:'warning', label: isFa?'عملیات ایجاد شد':'Operation Created' },
    'operation-completed':       { icon: <CheckCircle2 size={13}/>, bg:'bg-green-100',  color:'text-green-600',  badgeVariant:'success', label: isFa?'تکمیل شده':'Completed' },
    'operation-dismissed':       { icon: <ClipboardList size={13}/>,bg:'bg-slate-100',  color:'text-slate-500',  badgeVariant:'default', label: isFa?'رد شده':'Dismissed' },
    'workflow-activated':        { icon: <GitBranch size={13}/>,    bg:'bg-green-100',  color:'text-green-700',  badgeVariant:'success', label: isFa?'گردش‌کار فعال':'Workflow On' },
    'workflow-executed':         { icon: <Zap size={13}/>,          bg:'bg-blue-100',   color:'text-blue-600',   badgeVariant:'info',    label: isFa?'خودکار':'Automated' },
    'product-marked-removed':    { icon: <AlertTriangle size={13}/>,bg:'bg-orange-100', color:'text-orange-600', badgeVariant:'warning', label: isFa?'جمع‌آوری شد':'Removed' },
    'product-discounted':        { icon: <ShoppingBag size={13}/>,  bg:'bg-purple-100', color:'text-purple-600', badgeVariant:'info',    label: isFa?'تخفیف':'Discounted' },
    'batch-discounted':          { icon: <ShoppingBag size={13}/>,  bg:'bg-purple-100', color:'text-purple-600', badgeVariant:'info',    label: isFa?'تخفیف':'Discounted' },
    'stock-updated':             { icon: <Package size={13}/>,      bg:'bg-slate-100',  color:'text-slate-600',  badgeVariant:'default', label: isFa?'موجودی به‌روز شد':'Stock Updated' },
    'purchase-request-created':  { icon: <ShoppingBag size={13}/>,  bg:'bg-teal-100',   color:'text-teal-600',   badgeVariant:'info',    label: isFa?'درخواست خرید':'Purchase Request' },
  };

  const filterOptions = [
    { value: '',                    label: ac.allEvents },
    { value: 'workflow-executed',   label: ac.automated },
    { value: 'operation-completed', label: ac.completedFilter },
    { value: 'operation-created',   label: ac.operationsFilter },
    { value: 'product-expired',     label: ac.expiredFilter },
    { value: 'batch-added',         label: ac.batchAddedFilter },
  ];

  return (
    <div className="space-y-4">
      <div className={cn('flex items-start justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{ac.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{ac.subtitle}</p>
        </div>
        <div className={cn('flex items-center gap-1.5 flex-wrap justify-end', isRTL && 'flex-row-reverse')}>
          {filterOptions.map(opt => (
            <button key={opt.value} onClick={() => setFilter(opt.value)}
              className={cn(
                'text-xs rounded-full px-3 py-1 font-medium transition-colors',
                filter === opt.value ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className={cn('text-xs text-slate-400', isRTL && 'text-right')}>
        {isFa ? toPersian(filtered.length) : filtered.length} {ac.events}
      </p>

      {/* Heatmap */}
      <Card padding="md">
        <ActivityHeatmap />
      </Card>

      {filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState icon={<Activity size={24} />} title={ac.noActivity} description={ac.noActivityDesc} />
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([dateLabel, events]) => (
            <div key={dateLabel}>
              <div className={cn('flex items-center gap-2 mb-2.5', isRTL && 'flex-row-reverse')}>
                <span className="text-xs font-semibold text-slate-500">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">
                  {isFa ? toPersian(events.length) : events.length} {events.length === 1 ? ac.event : ac.events}
                </span>
              </div>

              <Card padding="none">
                {events.map((event, idx) => {
                  const cfg = eventConfig[event.type] ?? {
                    icon: <Activity size={13}/>, bg: 'bg-slate-100', color: 'text-slate-500',
                    badgeVariant: 'default' as const, label: event.type,
                  };
                  return (
                    <div key={event.id}
                      className={cn('flex items-start gap-3 px-4 py-3', idx !== 0 && 'border-t border-slate-50', isRTL && 'flex-row-reverse')}>
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                        {cfg.icon}
                      </div>
                      <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                        <div className={cn('flex items-start justify-between gap-2', isRTL && 'flex-row-reverse')}>
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            {isFa && event.titleFa ? event.titleFa : localise(event.title, isFa)}
                          </p>
                          <Badge variant={cfg.badgeVariant} size="sm" className="flex-shrink-0">{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {isFa && event.descriptionFa ? event.descriptionFa : localise(event.description, isFa)}
                        </p>
                        <div className={cn('flex items-center gap-2 mt-1.5 text-[11px] text-slate-400', isRTL && 'flex-row-reverse')}>
                          <span>{format(new Date(event.createdAt), 'HH:mm')}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
                          {event.actorName !== 'System' && (
                            <>
                              <span>·</span>
                              <span>{isFa ? (event.actorName === 'Marcus Chen' ? 'نیما طاهری' : event.actorName === 'Emma Wilson' ? 'سارا رضایی' : event.actorName === 'Sophie Blake' ? 'مهسا ابراهیمی' : event.actorName) : event.actorName}</span>
                            </>
                          )}
                          {event.actorName === 'System' && (
                            <><span>·</span>
                            <span className={cn('flex items-center gap-0.5 text-blue-500', isRTL && 'flex-row-reverse')}>
                              <Zap size={9} /> {t.common.automated}
                            </span></>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
