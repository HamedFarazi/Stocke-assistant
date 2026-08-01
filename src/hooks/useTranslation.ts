import { useLanguageStore } from '@/stores/languageStore';
import { translations } from '@/i18n';
import type { Translations } from '@/i18n';

export function useTranslation() {
  const { language } = useLanguageStore();
  const t = translations[language] as Translations;
  return { t, language, isRTL: language === 'fa' };
}
