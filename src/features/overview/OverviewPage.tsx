import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { generateSimulationEvents } from '@/services/simulationService';
import { SimulationBanner } from './SimulationBanner';
import { SimulationSummaryModal } from './SimulationSummaryModal';
import { useInventory } from '@/hooks/useInventory';
import { useOperations } from '@/hooks/useOperations';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle, Package, TrendingDown, ClipboardList, GitBranch,
  Layers, ArrowRight, CheckCircle2, Activity, ChevronRight,
  Zap, Clock, AlertCircle, Play, X,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { CreateOperationDialog } from '@/features/operations/CreateOperationDialog';
import { SmartRecommendations } from '@/components/ui/SmartRecommendations';
import type { AttentionItem } from '@/types';

import { useDemoStore } from '@/stores/demoStore';

interface OverviewPageProps {
  onNavigate: (section: string) => void;
}

const severityConfig = {
  critical: { card: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    badge: 'danger'  as const, label: 'Critical' },
  high:     { card: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400', badge: 'warning' as const, label: 'High' },
  medium:   { card: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-400',  badge: 'warning' as const, label: 'Medium' },
  low:      { card: 'bg-slate-50 border-slate-200',   dot: 'bg-slate-400',  badge: 'default' as const, label: 'Low' },
};

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  const { workflows, activities, executions } = useAppStore();
  const { isRunning, startSimulation } = useSimulationStore();
  const { isDemoMode } = useDemoStore();
  const { attentionItems, metrics } = useInventory();
  const { metrics: opMetrics } = useOperations();
  const { t, isRTL, language } = useTranslation();
  const { formatCurrencyCompact } = useCurrency();
  const { formatNumber, formatDate, formatRelativeTime } = useLocale();
  const [createOpItem, setCreateOpItem] = useState<AttentionItem | null>(null);
  const [demoTipDismissed, setDemoTipDismissed] = useState(false);
  const isFa = language === 'fa';

  function handleStartSim() {
    const events = generateSimulationEvents(isFa);
    startSimulation(events);
  }

  const ov = t.overview;
  const activeWorkflows = workflows.filter(w => w.status === 'active');
  const todayExecCount = executions.filter(e => {
    const d = new Date(e.startedAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const metricCards = [
    {
      label: ov.totalInventoryValue,
      value: formatCurrencyCompact(metrics.totalValue),
      iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
      sub: `${formatNumber(metrics.activeBatchCount)} ${ov.activeBatches}`,
    },
    {
      label: ov.expiringWithin7Days,
      value: formatNumber(metrics.expiringSoonCount),
      icon: <AlertTriangle size={17} />,
      iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
      sub: `${formatNumber(metrics.expiringTodayCount)} ${ov.expireToday}`,
      urgent: metrics.expiringSoonCount > 0,
      onClick: () => onNavigate('expiry'),
    },
    {
      label: ov.expiredProducts,
      value: formatNumber(metrics.expiredCount),
      icon: <AlertCircle size={17} />,
      iconBg: 'bg-red-100', iconColor: 'text-red-600',
      sub: ov.requiresImmediateAction,
      urgent: metrics.expiredCount > 0,
      onClick: () => onNavigate('expiry'),
    },
    {
      label: ov.lowStockItems,
      value: formatNumber(metrics.lowStockCount),
      icon: <TrendingDown size={17} />,
      iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
      sub: ov.belowMinimumLevel,
      onClick: () => onNavigate('inventory'),
    },
    {
      label: ov.openOperations,
      value: formatNumber(opMetrics.openCount),
      icon: <ClipboardList size={17} />,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      sub: `${formatNumber(opMetrics.inProgressCount)} ${ov.inProgress} · ${formatNumber(opMetrics.overdueCount)} ${t.common.overdue}`,
      urgent: opMetrics.overdueCount > 0,
      onClick: () => onNavigate('operations'),
    },
    {
      label: ov.workflowExecutions,
      value: formatNumber(todayExecCount || activeWorkflows.reduce((s, w) => s + w.executionCount, 0)),
      icon: <GitBranch size={17} />,
      iconBg: 'bg-green-100', iconColor: 'text-green-700',
      sub: `${formatNumber(activeWorkflows.length)} ${ov.workflows}`,
      onClick: () => onNavigate('workflows'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', isRTL && 'sm:flex-row-reverse')}>

        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{ov.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isRTL ? formatDate(new Date().toISOString()) : format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
          <div className="relative">
            <Button
              leftIcon={<Play size={15} />}
              onClick={() => {
                setDemoTipDismissed(true);
                handleStartSim();
              }}
              disabled={isRunning}
              className="bg-green-700 hover:bg-green-800 text-white shadow-md font-semibold text-xs relative z-10"
            >
              {isRunning ? (isFa ? 'شبیه‌ساز در حال اجرا…' : 'Simulation Running…') : (isFa ? 'اجرای شبیه‌ساز زنده فروشگاه' : 'Run Store Simulation')}
            </Button>

            {/* Onboarding Tooltip for Demo Mode */}
            {isDemoMode && !isRunning && !demoTipDismissed && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  'absolute top-12 z-30 w-72 bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-green-500/50 shadow-green-500/20',
                  isRTL ? 'right-0 text-right' : 'left-0 text-left'
                )}
              >
                <div className={cn('flex items-start gap-2.5', isRTL && 'flex-row-reverse')}>
                  <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                    <Play size={13} className="fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-400">
                      {isFa ? 'راهنمای شروع دمو' : 'Start Demo Simulation'}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFa
                        ? 'برای مشاهده شبیه‌سازی زنده سفارش‌ها، خریدهای مشتریان و هشدارهای انقضا روی دکمه بالا کلیک کنید!'
                        : 'Click the button above to start live store purchases, expiry alerts, and automated workflow events!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setDemoTipDismissed(true)}
                    className="text-slate-400 hover:text-white p-0.5 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
                {/* Arrow pointing up */}
                <div className={cn(
                  'absolute -top-1.5 w-3 h-3 bg-slate-900 border-t border-l border-green-500/50 rotate-45',
                  isRTL ? 'right-6' : 'left-6'
                )} />
              </motion.div>
            )}
          </div>

          {metrics.valueAtRisk > 0 && (
            <div className={cn(
              'hidden sm:flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2',
              isRTL && 'flex-row-reverse'
            )}>
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs font-medium text-red-700">
                {formatCurrencyCompact(metrics.valueAtRisk)} {ov.atRisk}
              </span>
            </div>
          )}
        </div>
      </div>


      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className={cn(
                'bg-white border border-slate-200 rounded-lg p-4 relative overflow-hidden transition-shadow',
                card.urgent && 'ring-1 ring-red-200 border-red-100',
                card.onClick && 'cursor-pointer hover:shadow-sm',
                isRTL && 'text-right'
              )}
              onClick={card.onClick}
            >
              {card.urgent && (
                <span className={cn(
                  'absolute top-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse',
                  isRTL ? 'left-2.5' : 'right-2.5'
                )} />
              )}
              <div className={cn('inline-flex p-1.5 rounded-md mb-2.5', card.iconBg, card.iconColor)}>
                {card.icon}
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5 leading-tight">{card.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className={cn('grid lg:grid-cols-5 gap-5', isRTL && 'direction-rtl')}>
        {/* Needs Attention */}
        <div className="lg:col-span-3 space-y-3">
          <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <h2 className="text-sm font-semibold text-slate-900">{ov.needsAttention}</h2>
              {attentionItems.length > 0 && (
                <Badge variant="danger">{formatNumber(attentionItems.length)}</Badge>
              )}
            </div>
            <button
              onClick={() => onNavigate('expiry')}
              className={cn('text-xs text-green-700 hover:text-green-800 flex items-center gap-0.5 hover:underline', isRTL && 'flex-row-reverse')}
            >
              {t.common.viewAll} {isRTL ? <ChevronRight size={12} className="rotate-180" /> : <ChevronRight size={12} />}
            </button>
          </div>

          {attentionItems.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">{ov.allClearTitle}</p>
              <p className="text-xs text-slate-500 mt-1">{ov.allClearDesc}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attentionItems.slice(0, 6).map((item, idx) => {
                const cfg = severityConfig[item.severity] ?? severityConfig.low;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: isRTL ? 6 : -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={cn('rounded-lg border p-3.5', cfg.card)}
                  >
                    <div className={cn('flex items-start justify-between gap-3', isRTL && 'flex-row-reverse')}>
                      <div className={cn('flex items-start gap-2.5 flex-1 min-w-0', isRTL && 'flex-row-reverse')}>
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
                        <div className={cn('min-w-0', isRTL && 'text-right')}>
                          <div className={cn('flex items-center gap-2 flex-wrap', isRTL && 'flex-row-reverse')}>
                            <span className="text-sm font-semibold text-slate-900">{item.productName}</span>
                            <Badge variant={cfg.badge} size="sm">{cfg.label}</Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.recommendedAction}</p>
                          <div className={cn('flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap', isRTL && 'flex-row-reverse')}>
                            <span>{formatNumber(item.quantity)} {t.common.units}</span>
                            {item.expiryDate && (
                              <span>{formatDistanceToNow(new Date(item.expiryDate), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button size="xs" variant="outline" className="flex-shrink-0" onClick={() => setCreateOpItem(item)}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {attentionItems.length > 6 && (
                <button
                  onClick={() => onNavigate('expiry')}
                  className="w-full text-center text-xs text-slate-500 hover:text-green-700 py-2 border border-dashed border-slate-200 rounded-lg hover:border-green-300 transition-colors"
                >
                  +{formatNumber(attentionItems.length - 6)} {ov.moreItems}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick actions */}
          <div>
            <h2 className={cn('text-sm font-semibold text-slate-900 mb-2.5', isRTL && 'text-right')}>{ov.quickActions}</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: ov.addBatch,      icon: <Package size={15} />,      section: 'inventory',  color: 'text-blue-600 bg-blue-50 border-blue-100' },
                { label: ov.newOperation,  icon: <ClipboardList size={15} />, section: 'operations', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { label: ov.checkExpiry,   icon: <AlertTriangle size={15} />, section: 'expiry',     color: 'text-red-600 bg-red-50 border-red-100' },
                { label: isRTL ? 'بینش‌های AI' : 'AI Insights', icon: <Zap size={15} />, section: 'insights', color: 'text-green-700 bg-green-50 border-green-100' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.section)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 border rounded-lg text-xs font-medium text-slate-800',
                    'hover:shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0',
                    'bg-white border-slate-200 hover:border-slate-300',
                    isRTL ? 'flex-row-reverse text-right' : 'text-left'
                  )}
                >
                  <span className={cn('p-1.5 rounded-md flex-shrink-0', action.color)}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Recommendations */}
          <SmartRecommendations onNavigate={onNavigate} maxItems={3} />
          {/* Activity feed */}
          <div>
            <div className={cn('flex items-center justify-between mb-2.5', isRTL && 'flex-row-reverse')}>
              <h2 className="text-sm font-semibold text-slate-900">{ov.recentActivity}</h2>
              <button onClick={() => onNavigate('activity')} className={cn('text-xs text-green-700 hover:underline flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                {t.common.viewAll} {isRTL ? <ChevronRight size={12} className="rotate-180" /> : <ChevronRight size={12} />}
              </button>
            </div>
            <Card padding="none">
              {activities.slice(0, 7).map((event, idx) => {
                const titleText = isFa
                  ? (event.titleFa ?? (
                      event.title.includes('Expiry Protection workflow completed') ? 'اجرای گردش‌کار محافظت از انقضا تکمیل شد' :
                      event.title.includes('Operation created: Review Greek Yogurt') ? 'عملیات ایجاد شد: بررسی تخفیف ماست یونانی' :
                      event.title.includes('Low Stock Protection workflow triggered') ? 'گردش‌کار محافظت از موجودی کم فعال شد' :
                      event.title.includes('Operation assigned to store staff') ? 'عملیات به کارکنان فروشگاه تخصیص یافت' :
                      event.title.includes('Baby Spinach marked as expired') ? 'اسفناج تازه منقضی شده علامت‌گذاری شد' :
                      event.title.includes('Operation completed: Remove expired Sourdough Loaf') ? 'عملیات تکمیل شد: جمع‌آوری نان تست خمیرترش منقضی‌شده' :
                      event.title.includes('Expiry Protection workflow activated') ? 'گردش‌کار محافظت از انقضا فعال‌سازی شد' : event.title
                    ))
                  : event.title;

                return (
                  <div key={event.id} className={cn('flex items-start gap-3 px-4 py-2.5', idx !== 0 && 'border-t border-slate-50', isRTL && 'flex-row-reverse')}>
                    <ActivityIcon type={event.type} />
                    <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                      <p className="text-xs font-medium text-slate-800 leading-snug line-clamp-1">
                        {titleText}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatRelativeTime(event.createdAt)}
                        {event.actorName !== 'System' && ` · ${isFa ? (event.actorName === 'Marcus Chen' ? 'نیما طاهری' : event.actorName === 'Emma Wilson' ? 'سارا رضایی' : event.actorName === 'Sophie Blake' ? 'مهسا ابراهیمی' : event.actorName) : event.actorName}`}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className={cn('px-4 py-2.5 border-t border-slate-100')}>
                <button onClick={() => onNavigate('activity')} className={cn('text-xs text-green-700 hover:underline flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  {ov.fullActivityLog} {isRTL ? <ArrowRight size={11} className="rotate-180" /> : <ArrowRight size={11} />}
                </button>
              </div>
            </Card>
          </div>

          {/* Active Workflows */}
          <div>
            <div className={cn('flex items-center justify-between mb-2.5', isRTL && 'flex-row-reverse')}>
              <h2 className="text-sm font-semibold text-slate-900">{ov.activeWorkflows}</h2>
              <button onClick={() => onNavigate('workflows')} className={cn('text-xs text-green-700 hover:underline flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                {ov.manageWorkflows} {isRTL ? <ChevronRight size={12} className="rotate-180" /> : <ChevronRight size={12} />}
              </button>
            </div>
            <Card padding="none">
              {activeWorkflows.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <GitBranch size={20} className="text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">{ov.noActiveWorkflows}</p>
                  <button onClick={() => onNavigate('workflows')} className="text-xs text-green-700 mt-1.5 hover:underline">
                    {ov.createFirstWorkflow}
                  </button>
                </div>
              ) : (
                activeWorkflows.map((wf, idx) => {
                  const wfName = isFa
                    ? (wf.nameFa ?? (
                        wf.name === 'Expiry Protection' ? 'محافظت از انقضا' :
                        wf.name === 'Expired Product Protection' ? 'محافظت از کالاهای منقضی‌شده' :
                        wf.name === 'Low Stock Protection' ? 'محافظت از موجودی کم' :
                        wf.name === 'High Risk Expiry' ? 'ریسک انقضای موجودی بالا' : wf.name
                      ))
                    : wf.name;

                  return (
                    <div key={wf.id} className={cn('flex items-center gap-3 px-4 py-2.5', idx !== 0 && 'border-t border-slate-50', isRTL && 'flex-row-reverse')}>
                      <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Zap size={11} className="text-green-700" />
                      </div>
                      <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {wfName}
                        </p>
                        <div className={cn('flex items-center gap-2 text-[11px] text-slate-400 mt-0.5', isRTL && 'flex-row-reverse')}>
                          <span>{formatNumber(wf.executionCount)} {ov.runs}</span>
                          {wf.lastExecutedAt && (
                            <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                              <Clock size={9} />
                              {formatRelativeTime(wf.lastExecutedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          
          
        </div>
      </div>

      <CreateOperationDialog open={!!createOpItem} onClose={() => setCreateOpItem(null)} prefilledItem={createOpItem} />
    </div>
  );
}


function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    'workflow-executed':  { icon: <Zap size={11} />,          bg: 'bg-blue-100',  color: 'text-blue-600' },
    'workflow-activated': { icon: <GitBranch size={11} />,    bg: 'bg-green-100', color: 'text-green-700' },
    'operation-completed':{ icon: <CheckCircle2 size={11} />, bg: 'bg-green-100', color: 'text-green-700' },
    'operation-created':  { icon: <ClipboardList size={11} />,bg: 'bg-amber-100', color: 'text-amber-600' },
    'product-expired':    { icon: <AlertTriangle size={11} />,bg: 'bg-red-100',   color: 'text-red-600' },
    'batch-added':        { icon: <Package size={11} />,      bg: 'bg-slate-100', color: 'text-slate-600' },
  };
  const cfg = map[type] ?? { icon: <Activity size={11} />, bg: 'bg-slate-100', color: 'text-slate-500' };
  return (
    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, cfg.color)}>
      {cfg.icon}
    </div>
  );
}
