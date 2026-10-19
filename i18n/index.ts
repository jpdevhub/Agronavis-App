import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';

export const SUPPORTED = ['en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED)[number];

export const isSupported = (code: string | null | undefined): code is SupportedLanguage =>
  SUPPORTED.includes(code as SupportedLanguage);

/**
 * Languages the screens are genuinely in.
 *
 * Not the same as `SUPPORTED`, which only says a translation file exists.
 * There is a complete Hindi file of 97 strings and exactly one screen reads
 * it — every other screen has its English written straight into the JSX — so
 * choosing Hindi today changes the language picker and nothing else.
 *
 * A farmer who selects their own language and watches the app stay in English
 * concludes it is broken, and they are closer to right than a label claiming
 * support would be. Until the screens are actually translated, English is the
 * only honest entry here.
 */
export const INTERFACE_READY: readonly string[] = ['en'];

/** Whether picking this language would visibly change the app. */
export const isInterfaceReady = (code: string | null | undefined): boolean =>
  INTERFACE_READY.includes(code ?? '');

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
