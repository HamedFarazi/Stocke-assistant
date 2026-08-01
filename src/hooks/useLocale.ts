import { useLanguageStore } from '@/stores/languageStore';
import { differenceInDays, parseISO } from 'date-fns';

const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

export function toPersianNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => persianDigits[parseInt(d)]);
}

function toJalali(date: Date): { year: number; month: number; day: number } {
  // Accurate Gregorian → Jalali conversion
  let jy: number, jm: number, jd: number;
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let g_d_no: number;
  const gy2 = gm > 2 ? gy + 1 : gy;
  g_d_no = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) g_d_no += [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) g_d_no++;
  g_d_no += gd - 1;

  let j_d_no = g_d_no - 79;
  const j_np = Math.floor(j_d_no / 12053);
  j_d_no %= 12053;
  jy = 979 + 33 * j_np + 4 * Math.floor(j_d_no / 1461);
  j_d_no %= 1461;
  if (j_d_no >= 366) {
    jy += Math.floor((j_d_no - 1) / 365);
    j_d_no = (j_d_no - 1) % 365;
  }
  let i: number;
  for (i = 0; i < 11 && j_d_no >= [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30][i]; i++) {
    j_d_no -= [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30][i];
  }
  jm = i + 1;
  jd = j_d_no + 1;
  return { year: jy, month: jm, day: jd };
}

export function useLocale() {
  const { language } = useLanguageStore();
  const isPersian = language === 'fa';

  function formatDate(dateStr: string): string {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (isPersian) {
      const { year, month, day } = toJalali(date);
      const pad = (n: number) => String(n).padStart(2, '0');
      return toPersianNum(`${year}/${pad(month)}/${pad(day)}`);
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateShort(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isPersian) {
      const { month, day } = toJalali(date);
      const pad = (n: number) => String(n).padStart(2, '0');
      return toPersianNum(`${pad(month)}/${pad(day)}`);
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function formatDaysRemaining(days: number | null): string {
    if (days === null) return '—';
    if (isPersian) {
      if (days < 0) return toPersianNum(Math.abs(days)) + ' روز پیش';
      if (days === 0) return 'امروز';
      if (days === 1) return 'فردا';
      return toPersianNum(days) + ' روز';
    }
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  function formatNumber(n: number): string {
    if (isPersian) return toPersianNum(n);
    return String(n);
  }

  function formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    if (isPersian) return toPersianNum(ms) + ' میلی‌ثانیه';
    return `${ms}ms`;
  }

  function getDaysUntilExpiry(dateStr: string): number {
    return differenceInDays(parseISO(dateStr), new Date());
  }

  return {
    formatDate,
    formatDateShort,
    formatDaysRemaining,
    formatNumber,
    formatDuration,
    getDaysUntilExpiry,
    isPersian,
    language,
  };
}
