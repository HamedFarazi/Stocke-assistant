import { en } from './en';
import { fa } from './fa';

export type Language = 'en' | 'fa';
export type Translations = typeof en;

export const translations: Record<Language, Translations> = {
  en,
  fa: fa as unknown as Translations,
};

export { en, fa };
