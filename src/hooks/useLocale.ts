import { useLanguageStore } from '@/stores/languageStore';
import { differenceInDays, parseISO } from 'date-fns';

const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

export function toPersianNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => persianDigits[parseInt(d)]);
}

function toJalali(date: Date): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    let year = 1405, month = 1, day = 1;
    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
    }
    return { year, month, day };
  } catch (e) {
    const gy = date.getFullYear();
    return { year: gy - 621, month: date.getMonth() + 1, day: date.getDate() };
  }
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

  function formatRelativeTime(dateStr: string): string {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (isPersian) {
        if (diffMinutes < 1) return 'همین الان';
        if (diffMinutes < 60) return `حدود ${toPersianNum(diffMinutes)} دقیقه پیش`;
        if (diffHours < 24) return `حدود ${toPersianNum(diffHours)} ساعت پیش`;
        if (diffDays === 1) return '۱ روز پیش';
        return `${toPersianNum(diffDays)} روز پیش`;
      }

      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `about ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `about ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return dateStr;
    }
  }

  return {
    formatDate,
    formatDateShort,
    formatDaysRemaining,
    formatNumber,
    formatDuration,
    formatRelativeTime,
    getDaysUntilExpiry,
    isPersian,
    language,
  };
}
