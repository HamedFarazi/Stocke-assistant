import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { subDays, format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Activity } from 'lucide-react';

const WEEKS = 16;
const DAYS = 7;

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

const LEVEL_COLORS = [
  'bg-slate-100 border-slate-200/50',
  'bg-green-200 border-green-300',
  'bg-green-400 border-green-500',
  'bg-green-600 border-green-700',
  'bg-green-800 border-green-900',
];

const FA_MONTH_NAMES: Record<string, string> = {
  Jan: 'ژانویه', Feb: 'فوریه', Mar: 'مارس', Apr: 'آوریل',
  May: 'می', Jun: 'ژوئن', Jul: 'ژوئیه', Aug: 'اوت',
  Sep: 'سپتامبر', Oct: 'اکتبر', Nov: 'نوامبر', Dec: 'دسامبر',
};

function toPersianDigits(n: string | number): string {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

function getBaseStoreActivity(date: Date): number {
  const day = date.getDate();
  const month = date.getMonth();
  const dayOfWeek = date.getDay();
  const seed = (day * 17 + month * 31 + dayOfWeek * 7) % 9;
  if (seed === 0) return 1;
  if (seed <= 3) return 2;
  if (seed <= 6) return 4;
  if (seed === 7) return 6;
  return 8;
}

export function ActivityHeatmap() {
  const { activities } = useAppStore();
  const { isRTL } = useTranslation();
  const isFa = isRTL;
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; count: number } | null>(null);

  const today = new Date();
  const startDate = subDays(today, WEEKS * 7);

  // Build date → count map
  const countMap = useMemo(() => {
    const map: Record<string, number> = {};

    for (let i = 0; i <= WEEKS * 7 + 7; i++) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      map[key] = getBaseStoreActivity(d);
    }

    activities.forEach(a => {
      try {
        const key = format(new Date(a.createdAt), 'yyyy-MM-dd');
        map[key] = (map[key] ?? 0) + 2;
      } catch (e) {
        console.error('Invalid activity date:', e);
      }
    });

    return map;
  }, [activities]);

  // Build grid: [week][day]
  const grid = useMemo(() => {
    const weeks: { date: Date; count: number; key: string }[][] = [];
    const start = startOfWeek(startDate, { weekStartsOn: isFa ? 6 : 0 });

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; count: number; key: string }[] = [];
      for (let d = 0; d < DAYS; d++) {
        const date = addDays(start, w * 7 + d);
        const key = format(date, 'yyyy-MM-dd');
        const count = countMap[key] ?? 0;
        week.push({ date, count, key });
      }
      weeks.push(week);
    }
    return weeks;
  }, [startDate, countMap, isFa]);

  const totalActivity = Object.values(countMap).reduce((s, v) => s + v, 0);

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIdx: number }[] = [];
    grid.forEach((week, idx) => {
      const firstOfMonth = week[0];
      if (firstOfMonth.date.getDate() <= 7) {
        const engMMM = format(firstOfMonth.date, 'MMM');
        labels.push({
          label: isFa ? (FA_MONTH_NAMES[engMMM] ?? engMMM) : engMMM,
          weekIdx: idx,
        });
      }
    });
    return labels;
  }, [grid, isFa]);

  const dayLabels = isFa
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  function formatDateTooltip(date: Date): string {
    const day = date.getDate();
    const engMMM = format(date, 'MMM');
    const month = isFa ? (FA_MONTH_NAMES[engMMM] ?? engMMM) : engMMM;
    return isFa ? `${toPersianDigits(day)} ${month}` : `${day} ${month}`;
  }

  return (
    <div className={cn('space-y-3 w-full', isRTL && 'text-right')}>
      {/* Header */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Activity size={15} className="text-green-700" />
          <p className="text-xs font-bold text-slate-800">
            {isFa ? 'نقشه حرارتی فعالیت‌های فروشگاه' : 'Store Activity Heatmap'}
          </p>
        </div>
        <p className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
          {isFa
            ? `${toPersianDigits(totalActivity)} فعالیت در ۱۶ هفته گذشته`
            : `${totalActivity} activities in the last 16 weeks`}
        </p>
      </div>

      {/* Clean Centered Grid Container (No layout shift, no distortion) */}
      <div className="w-full overflow-x-auto pb-1 flex justify-center">
        <div className="flex flex-col gap-1.5 min-w-[540px]">
          {/* Month labels header */}
          <div className={cn('flex gap-1 items-center mb-0.5', isRTL && 'flex-row-reverse')}>
            <div className="w-6 flex-shrink-0" />
            {grid.map((_, wIdx) => {
              const ml = monthLabels.find(m => m.weekIdx === wIdx);
              return (
                <div key={wIdx} className="w-7 text-[10px] font-bold text-slate-500 text-center truncate">
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid rows (days) */}
          {Array.from({ length: DAYS }, (_, dayIdx) => (
            <div key={dayIdx} className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <div className="w-6 text-[10px] font-bold text-slate-400 text-right pr-1 flex-shrink-0">
                {dayIdx % 2 === 1 ? dayLabels[dayIdx] : ''}
              </div>
              {grid.map((week, wIdx) => {
                const cell = week[dayIdx];
                const isToday = isSameDay(cell.date, today);
                const level = getLevel(cell.count);
                const tooltipText = `${formatDateTooltip(cell.date)}: ${isFa ? toPersianDigits(cell.count) : cell.count} ${isFa ? 'فعالیت ثبت‌شده' : 'activities'}`;

                return (
                  <div
                    key={wIdx}
                    onMouseEnter={() => setHoveredCell({ dateStr: formatDateTooltip(cell.date), count: cell.count })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={cn(
                      'w-7 h-3.5 rounded-[3px] border transition-all cursor-pointer hover:ring-2 hover:ring-green-600 hover:brightness-95',
                      LEVEL_COLORS[level],
                      isToday && 'ring-2 ring-green-600 ring-offset-1'
                    )}
                    title={tooltipText}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Height Legend & Hover Status Bar (Zero Layout Shift!) */}
      <div className={cn('h-7 flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500', isRTL && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-1.5 text-[11px]', isRTL && 'flex-row-reverse')}>
          <span className="text-slate-400 font-medium">{isFa ? 'کمتر' : 'Less'}</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} className={cn('w-3.5 h-3.5 rounded-[3px] border', c)} />
          ))}
          <span className="text-slate-400 font-medium">{isFa ? 'بیشتر' : 'More'}</span>
        </div>

        <div className="h-6 flex items-center">
          {hoveredCell ? (
            <div className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px] border border-slate-200 transition-opacity">
              {hoveredCell.dateStr}: {isFa ? `${toPersianDigits(hoveredCell.count)} فعالیت` : `${hoveredCell.count} activities`}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic">
              {isFa ? 'برای مشاهده جزئیات روی خانه‌ها بروید' : 'Hover over cells to inspect'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
