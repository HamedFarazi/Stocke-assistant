import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function applyLang(lang: Language) {
  const root = document.documentElement;
  if (lang === 'fa') {
    root.dir = 'rtl';
    root.lang = 'fa';
    root.classList.add('font-persian');
  } else {
    root.dir = 'ltr';
    root.lang = 'en';
    root.classList.remove('font-persian');
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => {
        applyLang(lang);
        set({ language: lang });
      },
    }),
    { name: 'freshflow-language' }
  )
);

// Apply on initial load (called from main.tsx)
export function initLanguage() {
  const stored = localStorage.getItem('freshflow-language');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { language?: Language } };
      const lang = parsed?.state?.language ?? 'en';
      applyLang(lang);
    } catch {
      applyLang('en');
    }
  }
}
