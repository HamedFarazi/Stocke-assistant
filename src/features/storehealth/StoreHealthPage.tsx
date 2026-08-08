import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useInventory } from '@/hooks/useInventory';
import { useOperations } from '@/hooks/useOperations';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Package, GitBranch, Leaf, Users, Truck, Activity,
} from 'lucide-react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

function ScoreRing({ score, size = 120, strokeWidth = 10, color = '#16a34a', label }: ScoreRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-slate-900"
        >
          {score}
        </motion.span>
        {label && <span className="text-[10px] text-slate-500 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

interface SubScoreBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

function SubScoreBar({ label, score, icon, color, description }: SubScoreBarProps) {
  const barColor = score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('p-1 rounded-md', color)}>{icon}</span>
          <span className="text-sm font-medium text-slate-800">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: barColor }}>{score}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

export function StoreHealthPage() {
  const { workflows, operations } = useAppStore();
  const { metrics: invMetrics } = useInventory();
  const { metrics: opMetrics } = useOperations();
  const { t, isRTL } = useTranslation();
  const { formatNumber } = useLocale();
  const isFa = isRTL;

  const scores = useMemo(() => {
    // Inventory Health: penalise expired + low stock
    const expiredPenalty = Math.min(invMetrics.expiredCount * 8, 40);
    const lowStockPenalty = Math.min(invMetrics.lowStockCount * 5, 30);
    const inventoryHealth = Math.max(100 - expiredPenalty - lowStockPenalty, 20);

    // Workflow Efficiency: active workflows / total products ratio
    const activeWfs = workflows.filter(w => w.status === 'active').length;
    const workflowEfficiency = Math.min(activeWfs * 22 + 12, 98);

    // Waste Score: fewer expiring = higher score
    const wasteScore = Math.max(100 - invMetrics.expiringSoonCount * 6 - invMetrics.expiredCount * 12, 15);

    // Staff Productivity: operations completed vs open
    const totalOps = operations.length;
    const completedOps = operations.filter(o => o.status === 'completed').length;
    const staffScore = totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 60;

    // Automation Coverage
    const automationScore = Math.min(activeWfs * 24, 96);

    // Supplier Performance (simulated)
    const supplierScore = 82;

    const overall = Math.round(
      (inventoryHealth * 0.25) + (workflowEfficiency * 0.2) + (wasteScore * 0.2) +
      (staffScore * 0.15) + (automationScore * 0.1) + (supplierScore * 0.1)
    );

    return { inventoryHealth, workflowEfficiency, wasteScore, staffScore, automationScore, supplierScore, overall };
  }, [workflows, operations, invMetrics]);

  const overallColor = scores.overall >= 80 ? '#16a34a' : scores.overall >= 60 ? '#f59e0b' : '#ef4444';
  const overallLabel = scores.overall >= 80
    ? (isFa ? 'عالی' : 'Excellent')
    : scores.overall >= 60
    ? (isFa ? 'متوسط' : 'Good')
    : (isFa ? 'نیاز به توجه' : 'Needs Work');

  const subScores: SubScoreBarProps[] = [
    {
      label: isFa ? 'سلامت موجودی' : 'Inventory Health',
      score: scores.inventoryHealth,
      icon: <Package size={13} className="text-blue-600" />,
      color: 'bg-blue-50',
      description: isFa
        ? `${formatNumber(invMetrics.expiredCount)} منقضی · ${formatNumber(invMetrics.lowStockCount)} موجودی کم`
        : `${invMetrics.expiredCount} expired · ${invMetrics.lowStockCount} low stock`,
    },
    {
      label: isFa ? 'کارایی گردش‌کار' : 'Workflow Efficiency',
      score: scores.workflowEfficiency,
      icon: <GitBranch size={13} className="text-green-600" />,
      color: 'bg-green-50',
      description: isFa
        ? `${formatNumber(workflows.filter(w => w.status === 'active').length)} گردش‌کار فعال`
        : `${workflows.filter(w => w.status === 'active').length} active workflows`,
    },
    {
      label: isFa ? 'امتیاز جلوگیری از اتلاف' : 'Waste Prevention',
      score: scores.wasteScore,
      icon: <Leaf size={13} className="text-emerald-600" />,
      color: 'bg-emerald-50',
      description: isFa
        ? `${formatNumber(invMetrics.expiringSoonCount)} محصول در آستانه انقضا`
        : `${invMetrics.expiringSoonCount} products expiring soon`,
    },
    {
      label: isFa ? 'بهره‌وری تیم' : 'Staff Productivity',
      score: scores.staffScore,
      icon: <Users size={13} className="text-purple-600" />,
      color: 'bg-purple-50',
      description: isFa
        ? `${formatNumber(operations.filter(o => o.status === 'completed').length)} عملیات تکمیل شده`
        : `${operations.filter(o => o.status === 'completed').length} operations completed`,
    },
    {
      label: isFa ? 'پوشش اتوماسیون' : 'Automation Coverage',
      score: scores.automationScore,
      icon: <Activity size={13} className="text-orange-600" />,
      color: 'bg-orange-50',
      description: isFa
        ? `${formatNumber(workflows.reduce((s, w) => s + w.executionCount, 0))} بار اجرا شده`
        : `${workflows.reduce((s, w) => s + w.executionCount, 0)} total executions`,
    },
    {
      label: isFa ? 'عملکرد تأمین‌کنندگان' : 'Supplier Performance',
      score: scores.supplierScore,
      icon: <Truck size={13} className="text-cyan-600" />,
      color: 'bg-cyan-50',
      description: isFa ? 'بر اساس تحویل به‌موقع و کیفیت' : 'Based on delivery and quality',
    },
  ];

  return (
    <div className="space-y-6">
      <div className={cn(isRTL && 'text-right')}>
        <h1 className="text-xl font-semibold text-slate-900">
          {isFa ? 'سلامت فروشگاه' : 'Store Health'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isFa ? 'نمای کلی از سلامت و کارایی عملیاتی فروشگاه' : 'Overall operational health and efficiency overview'}
        </p>
      </div>

      {/* Overall score */}
      <Card padding="lg">
        <div className={cn('flex flex-col sm:flex-row items-center gap-6', isRTL && 'sm:flex-row-reverse')}>
          <ScoreRing score={scores.overall} size={140} strokeWidth={12} color={overallColor} />
          <div className={cn('flex-1 space-y-2', isRTL && 'text-right')}>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{overallLabel}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isFa ? 'امتیاز کلی سلامت فروشگاه' : 'Overall Store Health Score'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: isFa ? 'عملیات باز' : 'Open Ops', value: formatNumber(opMetrics.openCount), color: 'text-amber-600' },
                { label: isFa ? 'گردش‌کار فعال' : 'Active WF', value: formatNumber(workflows.filter(w=>w.status==='active').length), color: 'text-green-700' },
                { label: isFa ? 'منقضی شده' : 'Expired', value: formatNumber(invMetrics.expiredCount), color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className={cn('bg-slate-50 rounded-lg p-2.5 text-center')}>
                  <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Sub scores */}
      <div className="grid md:grid-cols-2 gap-4">
        {subScores.map(s => (
          <Card key={s.label} padding="md">
            <SubScoreBar {...s} />
          </Card>
        ))}
      </div>

      {/* Health tip with rotating border glow */}
      <div className="relative p-[1.5px] rounded-xl overflow-hidden shadow-lg shadow-green-500/10 group">
        <div className="absolute inset-[-250%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#22c55e_120deg,#ffffff_180deg,#16a34a_240deg,transparent_360deg)] opacity-70" />
        <div className={cn('relative z-10 rounded-[10px] bg-green-50/90 backdrop-blur-sm border border-green-200/80 p-4', isRTL && 'text-right')}>
          <div className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
            <ShieldCheck size={20} className="text-green-700 flex-shrink-0 mt-0.5" />
            <div className={cn('flex-1', isRTL && 'text-right')}>
              <p className="text-sm font-bold text-green-800">
                {isFa ? 'پیشنهاد بهبود' : 'Improvement Suggestion'}
              </p>
              <p className="text-xs text-green-700 mt-1 leading-relaxed">
                {scores.overall < 70
                  ? (isFa
                    ? 'محصولات منقضی شده را فوراً از قفسه بردارید و یک گردش‌کار محافظت از انقضا فعال کنید تا امتیاز سلامت فروشگاه بهبود یابد.'
                    : 'Remove expired products from shelves immediately and activate an Expiry Protection workflow to improve your health score.')
                  : (isFa
                    ? 'عملکرد فروشگاه شما خوب است. برای بهبود بیشتر، گردش‌کارهای بیشتری فعال کنید.'
                    : 'Your store is performing well. Activate more workflows to push your score higher.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
