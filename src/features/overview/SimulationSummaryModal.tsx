import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useSimulationStore } from '@/stores/simulationStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { CheckCircle2, ShoppingBag, DollarSign, ClipboardList, GitBranch, ShieldCheck, TrendingUp } from 'lucide-react';

export function SimulationSummaryModal() {
  const { completedSummary, stopSimulation } = useSimulationStore();
  const { t, isRTL, language } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { formatNumber } = useLocale();
  const isFa = language === 'fa';

  if (!completedSummary) return null;

  function handleClose() {
    useSimulationStore.setState({ completedSummary: null });
  }

  return (
    <Dialog open={!!completedSummary} onClose={handleClose} title={isFa ? 'نتیجه شبیه‌سازی زنده فروشگاه' : 'Store Simulation Summary'}>
      <div className={cn('space-y-5 pt-2', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-green-900">
              {isFa ? 'شبیه‌سازی با موفقیت انجام شد!' : 'Simulation Completed Successfully!'}
            </h3>
            <p className="text-xs text-green-700 mt-0.5">
              {isFa ? 'تمامی رویدادها روی موجودی، اتوماسیون‌ها و فعالیت‌های واقعی اعمال شدند.' : 'All simulation events were applied live to store metrics & workflows.'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: isFa ? 'محصولات فروخته‌شده' : 'Products Sold', value: `${formatNumber(completedSummary.productsSold)} ${t.common.units}`, icon: <ShoppingBag size={16} className="text-blue-600" />, bg: 'bg-blue-50' },
            { label: isFa ? 'درآمد تولیدشده' : 'Revenue Generated', value: formatCurrency(completedSummary.revenueGenerated), icon: <DollarSign size={16} className="text-green-600" />, bg: 'bg-green-50' },
            { label: isFa ? 'عملیات‌های ایجادشده' : 'Operations Created', value: formatNumber(completedSummary.operationsCreated), icon: <ClipboardList size={16} className="text-amber-600" />, bg: 'bg-amber-50' },
            { label: isFa ? 'گردش‌کارهای اجراشده' : 'Workflows Executed', value: formatNumber(completedSummary.workflowsExecuted), icon: <GitBranch size={16} className="text-purple-600" />, bg: 'bg-purple-50' },
            { label: isFa ? 'جلوگیری از اتلاف' : 'Waste Prevented', value: formatCurrency(completedSummary.wastePrevented), icon: <ShieldCheck size={16} className="text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: isFa ? 'کاهش ریسک انقضا' : 'Risk Reduction', value: `${completedSummary.riskReduction}%`, icon: <TrendingUp size={16} className="text-sky-600" />, bg: 'bg-sky-50' },
          ].map(m => (
            <div key={m.label} className={cn('p-3 rounded-xl border border-slate-100 space-y-1', m.bg)}>
              <div className="flex items-center gap-2">
                {m.icon}
                <span className="text-[11px] font-medium text-slate-600">{m.label}</span>
              </div>
              <p className="text-base font-bold text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>

        <div className={cn('flex justify-end pt-2', isRTL && 'flex-row-reverse')}>
          <Button onClick={handleClose}>
            {isFa ? 'فهمیدم / بستن' : 'Done / Close'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
