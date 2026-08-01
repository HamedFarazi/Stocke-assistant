import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { subDays, format, startOfWeek, addDays, isSameDay } from 'date-fns';

const WEEKS = 16;
const DAYS = 7;

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const LEVEL_COLORS = [
  'bg-slate-100',
  'bg-green-200',
  'bg-green-400',
  'bg-green-600',
  'bg-green-800',
];

export function ActivityHeatmap() {
  const { activities } = useAppStore();
  const { t, isRTL } = useTranslation();
  const isFa = isRTL;

  const today = new Date();
  const startDate = subDays(today, WEEKS * 7);

  // Build date → count map
  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach(a => {
      const key = format(new Date(a.createdAt), 'yyyy-MM-dd');
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [activities]);

  // Build grid: [week][day]
  const grid = useMemo(() => {
    const weeks: { date: Date; count: number; key: string }[][] = [];
    const start = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday

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
  }, [startDate, countMap]);

  const totalActivity = Object.values(countMap).reduce((s, v) => s + v, 0);
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIdx: number }[] = [];
    grid.forEach((week, idx) => {
      const firstOfMonth = week[0];
      if (firstOfMonth.date.getDate() <= 7) {
        labels.push({
          label: format(firstOfMonth.date, isFa ? 'MMM' : 'MMM'),
          weekIdx: idx,
        });
      }
    });
    return labels;
  }, [grid, isFa]);

  const dayLabels = isFa
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('space-y-2', isRTL && 'text-right')}>
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <p className="text-xs font-semibold text-slate-600">
          {isFa ? 'نقشه فعالیت' : 'Activity Map'}
        </p>
        <p className="text-xs text-slate-400">
          {isFa ? `${totalActivity} فعالیت در ${WEEKS} هفته گذشته` : `${totalActivity} activities in the last ${WEEKS} weeks`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className={cn('inline-flex flex-col gap-1', isRTL && 'items-end')}>
          {/* Month labels */}
          <div className={cn('flex gap-1 mb-0.5', isRTL && 'flex-row-reverse')}>
            <div className="w-6" /> {/* day label spacer */}
            {grid.map((_, wIdx) => {
              const ml = monthLabels.find(m => m.weekIdx === wIdx);
              return (
                <div key={wIdx} className="w-3 text-[9px] text-slate-400 text-center">
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid rows (days) */}
          {Array.from({ length: DAYS }, (_, dayIdx) => (
            <div key={dayIdx} className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <div className="w-6 text-[9px] text-slate-400 text-right pr-1 flex-shrink-0">
                {dayIdx % 2 === 1 ? dayLabels[dayIdx] : ''}
              </div>
              {grid.map((week, wIdx) => {
                const cell = week[dayIdx];
                const isToday = isSameDay(cell.date, today);
                const level = getLevel(cell.count);
                return (
                  <div
                    key={wIdx}
                    className={cn(
                      'w-3 h-3 rounded-[2px] transition-all cursor-pointer hover:ring-1 hover:ring-slate-400',
                      LEVEL_COLORS[level],
                      isToday && 'ring-1 ring-green-600'
                    )}
                    title={`${format(cell.date, 'd MMM')}: ${cell.count} ${isFa ? 'فعالیت' : 'activities'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={cn('flex items-center gap-1.5 text-[10px] text-slate-400', isRTL && 'flex-row-reverse')}>
        <span>{isFa ? 'کمتر' : 'Less'}</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-[2px]', c)} />
        ))}
        <span>{isFa ? 'بیشتر' : 'More'}</span>
      </div>
    </div>
  );
}
