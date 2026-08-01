import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  expiredValueOverTime, wastePrevented, productsSavedFromExpiry,
  expiryRiskByCategory, lowStockTrend, workflowStats,
  operationsCompleted, avgResolutionTime,
} from '@/data/analytics';
import { TrendingDown, TrendingUp, Shield, Clock } from 'lucide-react';

const COLORS = ['#15803d','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4'];

export function AnalyticsPage() {
  const { t, isRTL } = useTranslation();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const { formatNumber } = useLocale();
  const an = t.analytics;
  const [range, setRange] = useState('30');
  const slice = parseInt(range);

  const expiredSlice   = expiredValueOverTime.slice(-slice);
  const wasteSlice     = wastePrevented.slice(-slice);
  const savedSlice     = productsSavedFromExpiry.slice(-slice);

  const totalExpired   = expiredSlice.reduce((s, d) => s + d.value, 0);
  const totalWaste     = wasteSlice.reduce((s, d) => s + d.value, 0);
  const totalSaved     = savedSlice.reduce((s, d) => s + d.value, 0);
  const totalOps       = operationsCompleted.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn('bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs', isRTL && 'text-right')}>
          <p className="font-medium text-slate-700 mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-slate-600">{p.name ? `${p.name}: ` : ''}{formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{an.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{an.subtitle}</p>
        </div>
        <Select value={range} onChange={e => setRange(e.target.value)} className="w-36 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
          <option value="7">{an.last7}</option>
          <option value="14">{an.last14}</option>
          <option value="30">{an.last30}</option>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: an.expiredValue,       value: formatCurrencyCompact(totalExpired), icon: <TrendingDown size={16} />, color: 'text-red-600',   bg: 'bg-red-50',   sub: `${an.period} ${formatNumber(slice)} ${an.days}` },
          { label: an.wastePrevented,     value: formatCurrencyCompact(totalWaste),   icon: <Shield size={16} />,        color: 'text-green-700', bg: 'bg-green-50', sub: an.estimatedSavings },
          { label: an.productsSaved,      value: formatNumber(Math.round(totalSaved)),icon: <TrendingUp size={16} />,    color: 'text-blue-700',  bg: 'bg-blue-50',  sub: an.productsSavedFrom },
          { label: an.operationsResolved, value: formatNumber(totalOps),              icon: <Clock size={16} />,         color: 'text-amber-700', bg: 'bg-amber-50', sub: an.completedInPeriod },
        ].map(c => (
          <Card key={c.label} padding="md" className={cn(isRTL && 'text-right')}>
            <div className={cn(`inline-flex p-1.5 rounded-md mb-2 ${c.bg} ${c.color}`)}>{c.icon}</div>
            <div className="text-xl font-bold text-slate-900">{c.value}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{c.label}</div>
            <div className="text-[11px] text-slate-400">{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader><CardTitle>{isRTL ? `${an.expiredValue} (تومان)` : an.expiredValueChart}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={expiredSlice}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10 }} orientation={isRTL ? 'right' : 'left'} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>{isRTL ? `${an.wastePrevented} (تومان)` : an.wastePreventedChart}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={wasteSlice}>
              <defs>
                <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10 }} orientation={isRTL ? 'right' : 'left'} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#15803d" fill="url(#wasteGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader><CardTitle>{an.riskByCategory}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={expiryRiskByCategory} dataKey="value" nameKey="category" cx="50%" cy="50%"
                outerRadius={70}
                innerRadius={0}
                label={(props: { category?: string; percent?: number }) =>
                  `${props.category ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1, stroke: '#94a3b8' }}
                paddingAngle={2}>
                {expiryRiskByCategory.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>{an.workflowSuccess}</CardTitle></CardHeader>
          <div className="space-y-2.5 mt-1">
            {workflowStats.map(wfs => (
              <div key={wfs.workflowId}>
                <div className={cn('flex justify-between text-xs mb-1', isRTL && 'flex-row-reverse')}>
                  <span className="text-slate-700 font-medium truncate">{wfs.workflowName}</span>
                  <span className="text-slate-500 mx-2 flex-shrink-0">{formatNumber(wfs.successRate)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${wfs.successRate}%` }} />
                </div>
                <div className={cn('text-[10px] text-slate-400 mt-0.5', isRTL && 'text-right')}>
                  {formatNumber(wfs.executions)} {an.executions} · {formatNumber(wfs.operationsCreated)} {t.workflows.operationsCreated}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader><CardTitle>{an.lowStockIncidents}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lowStockTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10 }} orientation={isRTL ? 'right' : 'left'} width={35} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>{an.avgResolutionTime}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={avgResolutionTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10 }} orientation={isRTL ? 'right' : 'left'} width={35} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
