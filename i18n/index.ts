import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';

export const SUPPORTED = ['en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED)[number];

export const isSupported = (code: string | null | undefined): code is SupportedLanguage =>
  SUPPORTED.includes(code as SupportedLanguage);

/** The device language, when Agronavis has strings for it. */
export function deviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : 'en';
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/**
 * Switches the UI language. The farmer's stored preference wins over the
 * device locale, so a Hindi speaker on an English phone still gets Hindi.
 */
export function setAppLanguage(code: string | null | undefined): void {
  const next = isSupported(code) ? code : 'en';
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export default i18n;
