import { useLanguageStore } from '@/stores/languageStore';

// GBP rate ≈ 65,000 IRR (Toman = IRR/10)
const GBP_TO_TOMAN = 65000;

function toPersianDigits(n: string): string {
  const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return n.replace(/[0-9]/g, d => persianDigits[parseInt(d)]);
}

function formatToman(value: number): string {
  const toman = Math.round(value * GBP_TO_TOMAN);
  const formatted = toman.toLocaleString('en-US'); // comma-separated
  return toPersianDigits(formatted) + ' تومان';
}

function formatGBP(value: number): string {
  return `£${value.toFixed(2)}`;
}

function formatGBPCompact(value: number): string {
  if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`;
  return `£${value.toFixed(2)}`;
}

function formatTomanCompact(value: number): string {
  const toman = Math.round(value * GBP_TO_TOMAN);
  if (toman >= 1_000_000) {
    return toPersianDigits((toman / 1_000_000).toFixed(1)) + ' میلیون تومان';
  }
  if (toman >= 1_000) {
    return toPersianDigits((toman / 1_000).toFixed(0)) + ' هزار تومان';
  }
  return toPersianDigits(toman.toString()) + ' تومان';
}

export function useCurrency() {
  const { language } = useLanguageStore();
  const isPersian = language === 'fa';

  return {
    formatCurrency: (value: number) =>
      isPersian ? formatToman(value) : formatGBP(value),
    formatCurrencyCompact: (value: number) =>
      isPersian ? formatTomanCompact(value) : formatGBPCompact(value),
    currencySymbol: isPersian ? 'تومان' : '£',
    isPersian,
  };
}
