import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useInventory } from '@/hooks/useInventory';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn, getDaysUntilExpiry } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '@/data/products';
import {
  Brain, Sparkles, AlertTriangle, TrendingDown,
  Package, Tag, Truck, Zap, ChevronRight,
  CheckCircle2, Clock, BarChart3, ShieldAlert,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority = 'critical' | 'high' | 'medium' | 'low';
type InsightType = 'expiry' | 'stock' | 'waste' | 'workflow' | 'supplier' | 'pattern';

interface Insight {
  id: string;
  type: InsightType;
  priority: Priority;
  confidence: number;
  title: string;
  reason: string;
  recommendation: string;
  impact: string;
  action: string;
  section: string;
  data?: Record<string, string | number>;
}

import type { ProductBatch, Operation, Workflow, Notification } from '@/types';

// ── Analysis engine (reads real app state) ────────────────────────────────────

function runAnalysis(
  batches: ProductBatch[],
  operations: Operation[],
  workflows: Workflow[],
  notifications: Notification[],
  formatCurrency: (n: number) => string,
  formatNumber: (n: number) => string,
  isFa: boolean,
): Insight[] {
  const insights: Insight[] = [];
  const activeBatches = batches.filter(b => b.status === 'active');

  // ── 1. Critical expiry: expired batches still marked active ──────────────
  const expired = activeBatches.filter(b => getDaysUntilExpiry(b.expiryDate) < 0);
  if (expired.length > 0) {
    const value = expired.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
    const product = products.find(p => p.id === expired[0].productId);
    insights.push({
      id: 'expired-active',
      type: 'expiry', priority: 'critical', confidence: 99,
      title: isFa ? `${formatNumber(expired.length)} دسته منقضی هنوز روی قفسه است` : `${expired.length} expired batch(es) still on shelf`,
      reason: isFa
        ? `دسته‌هایی مانند "${product?.name}" از تاریخ انقضا گذشته‌اند اما هنوز در سیستم فعال هستند.`
        : `Batches like "${product?.name}" have passed their expiry date but remain active in the system.`,
      recommendation: isFa
        ? 'فوراً این دسته‌ها را از قفسه جمع‌آوری کنید و از سیستم خارج کنید.'
        : 'Immediately remove these batches from shelves and mark them as disposed.',
      impact: isFa ? `ریسک سلامت و ${formatCurrency(value)} ضرر` : `Health risk + ${formatCurrency(value)} loss`,
      action: isFa ? 'مشاهده در مرکز انقضا' : 'View in Expiry Centre',
      section: 'expiry',
      data: { count: expired.length, value },
    });
  }

  // ── 2. Expiring within 3 days — high quantity batches ────────────────────
  const exp3 = activeBatches.filter(b => {
    const d = getDaysUntilExpiry(b.expiryDate); return d >= 0 && d <= 3;
  });
  if (exp3.length > 0) {
    const value = exp3.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
    const highQty = exp3.filter(b => b.quantity > 15);
    const confidence = highQty.length > 0 ? 94 : 82;
    insights.push({
      id: 'expiring-3d',
      type: 'expiry', priority: 'high', confidence,
      title: isFa ? `${formatNumber(exp3.length)} دسته در ۳ روز آینده منقضی می‌شود` : `${exp3.length} batch(es) expire in the next 3 days`,
      reason: isFa
        ? `${formatNumber(exp3.reduce((s, b) => s + b.quantity, 0))} واحد محصول با ارزش ${formatCurrency(value)} در آستانه انقضا هستند. ${highQty.length > 0 ? `${formatNumber(highQty.length)} دسته موجودی بالایی دارد.` : ''}`
        : `${exp3.reduce((s,b)=>s+b.quantity,0)} units worth ${formatCurrency(value)} are near expiry. ${highQty.length > 0 ? `${highQty.length} batch(es) have high quantities.` : ''}`,
      recommendation: isFa
        ? 'اعمال ۲۰–۳۰٪ تخفیف روی این محصولات برای تسریع فروش توصیه می‌شود.'
        : 'Apply 20–30% price discount on these products to accelerate sell-through.',
      impact: isFa ? `${formatCurrency(value)} در معرض خطر` : `${formatCurrency(value)} at risk`,
      action: isFa ? 'مشاهده مرکز انقضا' : 'Open Expiry Centre',
      section: 'expiry',
      data: { count: exp3.length, value, units: exp3.reduce((s,b)=>s+b.quantity,0) },
    });
  }

  // ── 3. Low stock + upcoming expiry conflict ───────────────────────────────
  const lowStockProd = products.filter(p => {
    const totalQty = activeBatches.filter(b => b.productId === p.id).reduce((s,b) => s+b.quantity, 0);
    return totalQty > 0 && totalQty < p.minStockLevel;
  });
  if (lowStockProd.length > 0) {
    insights.push({
      id: 'low-stock',
      type: 'stock', priority: 'high', confidence: 91,
      title: isFa ? `${formatNumber(lowStockProd.length)} محصول زیر حداقل موجودی` : `${lowStockProd.length} product(s) below minimum stock`,
      reason: isFa
        ? `محصولاتی مانند "${lowStockProd[0]?.name}" به زودی تمام می‌شوند. بر اساس نرخ فروش معمول ممکن است در ۲–۳ روز آینده ناموجود شوند.`
        : `Products like "${lowStockProd[0]?.name}" are running low. Based on typical sales velocity, stockout may occur in 2–3 days.`,
      recommendation: isFa
        ? 'درخواست خرید فوری برای این محصولات ثبت کنید و به تأمین‌کنندگان اطلاع دهید.'
        : 'Raise urgent purchase requests and notify suppliers for these products.',
      impact: isFa ? 'از دست دادن فروش و نارضایتی مشتری' : 'Lost sales + customer dissatisfaction',
      action: isFa ? 'ایجاد درخواست خرید' : 'Create Purchase Requests',
      section: 'inventory',
      data: { count: lowStockProd.length },
    });
  }

  // ── 4. Inactive workflows with active risk ────────────────────────────────
  const inactiveWf = workflows.filter(w => w.status === 'inactive' || w.status === 'draft');
  const hasExpiredProducts = expired.length > 0 || exp3.length > 0;
  if (inactiveWf.length > 0 && hasExpiredProducts) {
    insights.push({
      id: 'inactive-workflows',
      type: 'workflow', priority: 'high', confidence: 87,
      title: isFa ? `${formatNumber(inactiveWf.length)} گردش‌کار محافظتی غیرفعال است` : `${inactiveWf.length} protective workflow(s) are inactive`,
      reason: isFa
        ? `در حالی که موجودی در معرض خطر انقضاست، گردش‌کارهایی مانند "${inactiveWf[0]?.name}" غیرفعال هستند و هیچ هشدار خودکاری ارسال نمی‌شود.`
        : `While inventory is at expiry risk, workflows like "${inactiveWf[0]?.name}" are inactive — no automated alerts are firing.`,
      recommendation: isFa
        ? 'گردش‌کارهای حفاظت از انقضا و موجودی کم را فوراً فعال کنید.'
        : 'Immediately activate Expiry Protection and Low Stock Protection workflows.',
      impact: isFa ? 'ریسک‌های منقضی و موجودی کم بدون هشدار' : 'Expiry and stock risks going undetected',
      action: isFa ? 'مدیریت گردش‌کارها' : 'Manage Workflows',
      section: 'workflows',
      data: { count: inactiveWf.length },
    });
  }

  // ── 5. High value at risk ─────────────────────────────────────────────────
  const exp7 = activeBatches.filter(b => { const d = getDaysUntilExpiry(b.expiryDate); return d >= 0 && d <= 7; });
  const totalRisk = [...expired, ...exp7].reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
  if (totalRisk > 100) {
    insights.push({
      id: 'high-value-risk',
      type: 'waste', priority: 'high', confidence: 96,
      title: isFa ? `${formatCurrency(totalRisk)} ارزش موجودی در معرض خطر` : `${formatCurrency(totalRisk)} inventory value at risk`,
      reason: isFa
        ? `مجموع موجودی منقضی یا در آستانه انقضا نشان‌دهنده زیان قابل‌توجهی است که می‌توان از آن جلوگیری کرد.`
        : `The combined value of expired and near-expiry inventory represents a significant preventable loss.`,
      recommendation: isFa
        ? 'برنامه مدیریت اتلاف ایجاد کنید. قیمت‌گذاری پویا و گردش‌کارهای تخفیف خودکار را فعال کنید.'
        : 'Implement a waste management plan. Enable dynamic pricing and automated discount workflows.',
      impact: isFa ? `صرفه‌جویی تخمینی ${formatCurrency(totalRisk * 0.6)}` : `Estimated ${formatCurrency(totalRisk * 0.6)} preventable`,
      action: isFa ? 'مشاهده تحلیل‌ها' : 'View Analytics',
      section: 'analytics',
      data: { value: totalRisk },
    });
  }

  // ── 6. Overdue operations ────────────────────────────────────────────────
  const overdueOps = operations.filter(o => {
    return (o.status === 'pending' || o.status === 'in-progress') && new Date(o.dueDate) < new Date();
  });
  if (overdueOps.length > 0) {
    insights.push({
      id: 'overdue-ops',
      type: 'pattern', priority: 'medium', confidence: 100,
      title: isFa ? `${formatNumber(overdueOps.length)} عملیات تأخیر دارد` : `${overdueOps.length} operation(s) are overdue`,
      reason: isFa
        ? `عملیات‌هایی که از مهلتشان گذشته اما هنوز کامل نشده‌اند نشان‌دهنده مشکل در بهره‌وری تیم است.`
        : `Operations past their due dates signal team productivity issues or resource bottlenecks.`,
      recommendation: isFa
        ? 'عملیات‌های با تأخیر را مرور کنید و آنها را به اعضای تیم با ظرفیت مجدد تخصیص دهید.'
        : 'Review overdue operations and reassign them to available team members.',
      impact: isFa ? 'کاهش کیفیت خدمت و افزایش ریسک' : 'Reduced service quality + compounding risk',
      action: isFa ? 'مشاهده عملیات‌ها' : 'View Operations',
      section: 'operations',
      data: { count: overdueOps.length },
    });
  }

  // ── 7. Unread critical notifications ─────────────────────────────────────
  const unreadCritical = notifications.filter(n => !n.isRead && n.type === 'critical-expiry');
  if (unreadCritical.length > 0) {
    insights.push({
      id: 'unread-critical',
      type: 'pattern', priority: 'medium', confidence: 88,
      title: isFa ? `${formatNumber(unreadCritical.length)} هشدار بحرانی خوانده نشده` : `${unreadCritical.length} unread critical alert(s)`,
      reason: isFa
        ? 'هشدارهای بحرانی انقضا خوانده نشده‌اند که می‌تواند نشان‌دهنده نبود پاسخ به موقع باشد.'
        : 'Critical expiry alerts have gone unread, suggesting delayed response to urgent situations.',
      recommendation: isFa
        ? 'اعلان‌ها را بررسی کنید و سیستم هشدار را برای اطمینان از پاسخ سریع تنظیم کنید.'
        : 'Review notifications and configure alerting to ensure timely response.',
      impact: isFa ? 'تأخیر در واکنش به ریسک‌های بحرانی' : 'Delayed response to critical risks',
      action: isFa ? 'مشاهده اعلان‌ها' : 'View Notifications',
      section: 'overview',
      data: { count: unreadCritical.length },
    });
  }

  // ── 8. Positive: workflows performing well ───────────────────────────────
  const activeWf = workflows.filter(w => w.status === 'active');
  const totalExec = activeWf.reduce((s, w) => s + w.executionCount, 0);
  if (activeWf.length >= 2 && totalExec >= 5) {
    insights.push({
      id: 'workflow-health',
      type: 'workflow', priority: 'low', confidence: 97,
      title: isFa ? `گردش‌کارهای خودکار به خوبی عمل می‌کنند` : `Automated workflows are performing well`,
      reason: isFa
        ? `${formatNumber(activeWf.length)} گردش‌کار فعال در مجموع ${formatNumber(totalExec)} بار اجرا شده‌اند و نشان‌دهنده پوشش اتوماسیون خوبی است.`
        : `${activeWf.length} active workflows have executed ${totalExec} times total, indicating good automation coverage.`,
      recommendation: isFa
        ? 'گردش‌کار High Risk Expiry را فعال کنید تا پوشش را به حداکثر برسانید.'
        : 'Consider activating the High Risk Expiry workflow to maximize coverage.',
      impact: isFa ? 'صرفه‌جویی در زمان تیم' : 'Team time savings + reduced manual effort',
      action: isFa ? 'مشاهده گردش‌کارها' : 'View Workflows',
      section: 'workflows',
      data: { activeCount: activeWf.length, execCount: totalExec },
    });
  }

  // Sort by priority
  const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ── Analysis steps shown during loading ──────────────────────────────────────

const STEPS_EN = [
  'Connecting to store data…',
  'Analysing inventory & batches…',
  'Checking expiry timelines…',
  'Detecting low stock patterns…',
  'Reviewing workflow performance…',
  'Scanning for unusual patterns…',
  'Calculating risk scores…',
  'Generating recommendations…',
  'Almost done…',
];
const STEPS_FA = [
  'اتصال به داده‌های فروشگاه…',
  'تحلیل موجودی و دسته‌ها…',
  'بررسی تایم‌لاین‌های انقضا…',
  'شناسایی الگوهای موجودی کم…',
  'مرور عملکرد گردش‌کارها…',
  'اسکن الگوهای غیرمعمول…',
  'محاسبه امتیازات ریسک…',
  'تولید توصیه‌ها…',
  'تقریباً تمام شد…',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { badge: 'danger'|'warning'|'default'; label: { en: string; fa: string }; dot: string }> = {
  critical: { badge: 'danger',  label: { en: 'Critical', fa: 'بحرانی' },      dot: 'bg-red-500' },
  high:     { badge: 'warning', label: { en: 'High',     fa: 'بالا' },         dot: 'bg-orange-400' },
  medium:   { badge: 'warning', label: { en: 'Medium',   fa: 'متوسط' },        dot: 'bg-amber-400' },
  low:      { badge: 'default', label: { en: 'Low',      fa: 'پایین' },        dot: 'bg-slate-400' },
};

const TYPE_ICON: Record<InsightType, React.ReactNode> = {
  expiry:   <AlertTriangle size={15} className="text-red-500" />,
  stock:    <TrendingDown size={15} className="text-orange-500" />,
  waste:    <ShieldAlert size={15} className="text-amber-500" />,
  workflow: <Zap size={15} className="text-blue-500" />,
  supplier: <Truck size={15} className="text-purple-500" />,
  pattern:  <BarChart3 size={15} className="text-slate-500" />,
};

function confidenceColor(v: number) {
  return v >= 90 ? '#16a34a' : v >= 70 ? '#f59e0b' : '#94a3b8';
}

function ConfidenceBar({ value }: { value: number }) {
  const color = confidenceColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type AnalysisState = 'idle' | 'loading' | 'done';

export function InsightsPage() {
  const { batches, operations, workflows, notifications } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatNumber } = useLocale();
  const isFa = isRTL;

  const [state, setState] = useState<AnalysisState>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);

  const steps = isFa ? STEPS_FA : STEPS_EN;

  const startAnalysis = useCallback(async () => {
    setState('loading');
    setStepIdx(0);
    setProgress(0);

    const totalDuration = 3800; // ms
    const stepDuration = totalDuration / steps.length;

    // Animate through steps
    for (let i = 0; i < steps.length; i++) {
      setStepIdx(i);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(r => setTimeout(r, stepDuration));
    }

    // Run the actual analysis against real data
    const results = runAnalysis(
      batches, operations, workflows, notifications,
      formatCurrency, formatNumber, isFa
    );

    setInsights(results);
    setState('done');
  }, [batches, operations, workflows, notifications, formatCurrency, formatNumber, isFa, steps]);

  const labels = {
    pageTitle:   isFa ? 'بینش‌های هوش مصنوعی' : 'AI Insights',
    pageSubtitle: isFa ? 'تحلیل پیشرفته بر اساس داده‌های واقعی فروشگاه' : 'Advanced analysis based on real store data',
    cta:         isFa ? 'تحلیل فروشگاه با هوش مصنوعی' : 'Analyze Store with AI',
    ctaHint:     isFa ? 'تحلیل جامع موجودی، انقضا، عملیات و گردش‌کارها' : 'Comprehensive analysis of inventory, expiry, operations & workflows',
    re:          isFa ? 'تحلیل مجدد' : 'Re-analyse',
    found:       isFa ? 'یافته' : 'findings',
    analyzing:   steps[stepIdx] ?? (isFa ? 'در حال تحلیل…' : 'Analysing…'),
    reason:      isFa ? 'دلیل' : 'Reason',
    recommendation: isFa ? 'توصیه' : 'Recommendation',
    impact:      isFa ? 'تأثیر تجاری' : 'Business Impact',
    action:      isFa ? 'اقدام پیشنهادی' : 'Suggested Action',
    confidence:  isFa ? 'سطح اطمینان' : 'Confidence',
    noInsights:  isFa ? 'همه چیز مرتب است! فروشگاه شما در وضعیت خوبی قرار دارد.' : 'All clear! Your store is in excellent health.',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={cn(isRTL && 'text-right')}>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Brain size={20} className="text-green-700" />
          <h1 className="text-xl font-semibold text-slate-900">{labels.pageTitle}</h1>
          <Badge variant="info" size="sm">{isFa ? 'پیشرفته' : 'Advanced'}</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">{labels.pageSubtitle}</p>
      </div>

      {/* CTA — idle state */}
      {state === 'idle' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg" className="border-2 border-dashed border-green-200 bg-green-50/30">
            <div className={cn('flex flex-col sm:flex-row items-center gap-5', isRTL && 'sm:flex-row-reverse')}>
              <div className="w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className={cn('flex-1', isRTL && 'text-right')}>
                <h2 className="text-base font-semibold text-slate-900">{labels.cta}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{labels.ctaHint}</p>
              </div>
              <Button
                size="lg"
                leftIcon={<Brain size={16} />}
                onClick={startAnalysis}
                className="flex-shrink-0"
              >
                {labels.cta}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {state === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <Card padding="none" className="overflow-hidden">
              <div className="px-8 py-12 flex flex-col items-center gap-6">
                {/* Animated brain icon */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center shadow-xl"
                  >
                    <Brain size={30} className="text-white" />
                  </motion.div>
                  {/* Orbiting dots */}
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-green-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
                      style={{
                        originX: '0%', originY: '0%',
                        x: (28 + i * 8) * Math.cos(i * 2.1) - 4,
                        y: (28 + i * 8) * Math.sin(i * 2.1) - 4,
                      }}
                    />
                  ))}
                </div>

                {/* Status text */}
                <div className="text-center space-y-1">
                  <AnimatePresence mode="wait">
                    <motion.p key={stepIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium text-slate-800"
                    >
                      {steps[stepIdx]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-slate-400">
                    {isFa ? 'در حال پردازش داده‌های فروشگاه…' : 'Processing store data…'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{isFa ? 'پیشرفت' : 'Progress'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Step pills */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <motion.div key={i}
                      className={cn('rounded-full transition-all', i <= stepIdx ? 'bg-green-600' : 'bg-slate-200')}
                      animate={{ width: i === stepIdx ? 20 : 6, height: 6 }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {state === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Summary bar */}
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-slate-900">
                  {isFa
                    ? `تحلیل کامل شد — ${formatNumber(insights.length)} ${labels.found}`
                    : `Analysis complete — ${insights.length} ${labels.found}`}
                </span>
              </div>
              <Button size="sm" variant="outline" leftIcon={<Brain size={13} />} onClick={startAnalysis}>
                {labels.re}
              </Button>
            </div>

            {/* Priority chips */}
            <div className={cn('flex flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
              {(['critical','high','medium','low'] as Priority[]).map(p => {
                const count = insights.filter(i => i.priority === p).length;
                if (!count) return null;
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <Badge key={p} variant={cfg.badge}>
                    {count} {isFa ? cfg.label.fa : cfg.label.en}
                  </Badge>
                );
              })}
            </div>

            {/* No insights */}
            {insights.length === 0 && (
              <Card padding="lg" className="text-center">
                <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">{labels.noInsights}</p>
              </Card>
            )}

            {/* Insight cards */}
            {insights.map((insight, idx) => {
              const cfg = PRIORITY_CONFIG[insight.priority];
              const borderColor = insight.priority === 'critical' ? 'border-red-200 bg-red-50/20'
                : insight.priority === 'high' ? 'border-orange-200 bg-orange-50/10'
                : insight.priority === 'medium' ? 'border-amber-200 bg-amber-50/10'
                : 'border-slate-200 bg-white';

              return (
                <motion.div key={insight.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.35 }}>
                  <Card padding="md" className={cn('border', borderColor)}>
                    <div className="space-y-3">
                      {/* Top row */}
                      <div className={cn('flex items-start justify-between gap-3', isRTL && 'flex-row-reverse')}>
                        <div className={cn('flex items-center gap-2.5', isRTL && 'flex-row-reverse')}>
                          <div className={cn('p-1.5 rounded-lg flex-shrink-0',
                            insight.priority === 'critical' ? 'bg-red-100' :
                            insight.priority === 'high' ? 'bg-orange-100' :
                            insight.priority === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
                          )}>
                            {TYPE_ICON[insight.type]}
                          </div>
                          <h3 className={cn('text-sm font-semibold text-slate-900 leading-snug', isRTL && 'text-right')}>
                            {insight.title}
                          </h3>
                        </div>
                        <div className={cn('flex items-center gap-1.5 flex-shrink-0', isRTL && 'flex-row-reverse')}>
                          <Badge variant={cfg.badge} size="sm">
                            {isFa ? cfg.label.fa : cfg.label.en}
                          </Badge>
                        </div>
                      </div>

                      {/* Body grid */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className={cn('space-y-0.5', isRTL && 'text-right')}>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{labels.reason}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{insight.reason}</p>
                        </div>
                        <div className={cn('space-y-0.5', isRTL && 'text-right')}>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{labels.recommendation}</p>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{insight.recommendation}</p>
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div className={cn('flex items-end justify-between gap-4 pt-1 border-t border-slate-100', isRTL && 'flex-row-reverse')}>
                        <div className="flex-1 space-y-1.5">
                          <div className={cn('flex items-center gap-3 text-xs text-slate-500', isRTL && 'flex-row-reverse')}>
                            <span className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                              <span className="font-medium text-slate-700">{labels.impact}:</span> {insight.impact}
                            </span>
                          </div>
                          <div className="max-w-[200px]">
                            <p className="text-[10px] text-slate-400 mb-1">{labels.confidence}</p>
                            <ConfidenceBar value={insight.confidence} />
                          </div>
                        </div>
                        <button
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900',
                            'px-2.5 py-1.5 rounded-md bg-green-50 hover:bg-green-100 transition-colors flex-shrink-0',
                            isRTL && 'flex-row-reverse'
                          )}
                        >
                          {insight.action}
                          <ChevronRight size={11} className={cn(isRTL && 'rotate-180')} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
