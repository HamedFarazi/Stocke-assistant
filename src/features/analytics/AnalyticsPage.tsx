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
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={expiredSlice} margin={{ top: 15, right: isRTL ? 40 : 20, left: isRTL ? 20 : 40, bottom: 20 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10, dx: isRTL ? 10 : -10 }} orientation={isRTL ? 'right' : 'left'} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>{isRTL ? `${an.wastePrevented} (تومان)` : an.wastePreventedChart}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={wasteSlice} margin={{ top: 15, right: isRTL ? 40 : 20, left: isRTL ? 20 : 40, bottom: 20 }}>
              <defs>
                <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10, dx: isRTL ? 10 : -10 }} orientation={isRTL ? 'right' : 'left'} width={55} />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <ResponsiveContainer width="100%" height={200} className="max-w-[220px]">
              <PieChart>
                <Pie
                  data={expiryRiskByCategory}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {expiryRiskByCategory.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Clean Legend for Pie Chart with Full Hover Tooltip Details */}
            <div className={cn('flex-1 grid grid-cols-2 gap-2 text-xs w-full', isRTL && 'text-right')}>
              {expiryRiskByCategory.map((item, idx) => {
                const categoryNames: Record<string, string> = {
                  'Dairy': 'لبنیات',
                  'Bakery': 'نان و شیرینی',
                  'Meat & Poultry': 'گوشت و پروتئین',
                  'Produce': 'میوه و سبزیجات',
                  'Seafood': 'فرآورده‌های دریایی',
                  'Deli': 'پروتئین و کالباس',
                };
                const catName = isRTL ? (categoryNames[item.category] ?? item.category) : item.category;
                const totalVal = expiryRiskByCategory.reduce((s, c) => s + c.value, 0);
                const pct = Math.round((item.value / totalVal) * 100);
                const fullTooltip = isRTL
                  ? `دسته: ${catName}\nارزش کل در معرض خطر: ${formatCurrency(item.value)}\nسهم از کل: ${pct}٪`
                  : `Category: ${catName}\nTotal Value at Risk: ${formatCurrency(item.value)}\nShare: ${pct}%`;

                return (
                  <div
                    key={item.category}
                    title={fullTooltip}
                    className={cn(
                      'group relative flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate group-hover:text-green-800 transition-colors">{catName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{formatCurrencyCompact(item.value)} ({pct}%)</p>
                    </div>

                    {/* Rich Floating Tooltip Card on Hover */}
                    <div className={cn(
                      'opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] transition-all transform group-hover:translate-y-0 translate-y-1',
                      isRTL && 'text-right'
                    )}>
                      <div className="flex items-center gap-1.5 mb-1 font-bold text-green-400">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        {catName}
                      </div>
                      <div className="space-y-0.5 text-slate-300">
                        <p>{isRTL ? 'ارزش کل:' : 'Total Value:'} <span className="text-white font-semibold">{formatCurrency(item.value)}</span></p>
                        <p>{isRTL ? 'سهم از کل ریسک:' : 'Risk Share:'} <span className="text-white font-semibold">{pct}%</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={lowStockTrend} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" reversed={isRTL} />
              <YAxis tick={{ fontSize: 10 }} orientation={isRTL ? 'right' : 'left'} width={35} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>{an.avgResolutionTime}</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={avgResolutionTime} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
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
