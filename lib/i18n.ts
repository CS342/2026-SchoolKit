import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Each UI area owns one namespace file per language (locales/<lng>/<area>.json),
// each holding a single top-level key = the area name. They are merged into one
// flat `translation` resource here, so screens use `t('area.key')` everywhere and
// parallel work on different areas never touches the same file.
import common_en from '../locales/en/common.json';
import onboarding_en from '../locales/en/onboarding.json';
import home_en from '../locales/en/home.json';
import profile_en from '../locales/en/profile.json';
import stories_en from '../locales/en/stories.json';
import auth_en from '../locales/en/auth.json';
import journal_en from '../locales/en/journal.json';
import editor_en from '../locales/en/editor.json';
import design_en from '../locales/en/design.json';

import common_es from '../locales/es/common.json';
import onboarding_es from '../locales/es/onboarding.json';
import home_es from '../locales/es/home.json';
import profile_es from '../locales/es/profile.json';
import stories_es from '../locales/es/stories.json';
import auth_es from '../locales/es/auth.json';
import journal_es from '../locales/es/journal.json';
import editor_es from '../locales/es/editor.json';
import design_es from '../locales/es/design.json';

const en = {
  ...common_en,
  ...onboarding_en,
  ...home_en,
  ...profile_en,
  ...stories_en,
  ...auth_en,
  ...journal_en,
  ...editor_en,
  ...design_en,
};

const es = {
  ...common_es,
  ...onboarding_es,
  ...home_es,
  ...profile_es,
  ...stories_es,
  ...auth_es,
  ...journal_es,
  ...editor_es,
  ...design_es,
};

/**
 * Maps the app's stored language value ('english' | 'spanish') to the BCP-47
 * locale codes i18next uses. The onboarding/profile layer stores the words;
 * everything below the i18n seam speaks 'en' / 'es'.
 */
export const LANGUAGE_TO_LOCALE = {
  english: 'en',
  spanish: 'es',
} as const;

export type AppLanguage = keyof typeof LANGUAGE_TO_LOCALE;

export function localeFor(language: AppLanguage | string | null | undefined): 'en' | 'es' {
  return language === 'spanish' ? 'es' : 'en';
}

/** Switch the active UI language from a stored app language value. */
export function applyAppLanguage(language: AppLanguage | string | null | undefined) {
  const locale = localeFor(language);
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: 'en',
    fallbackLng: 'en',
    // We reference explicit *One/*Other keys ourselves, so i18next's own plural
    // backend (which relies on Intl.PluralRules) is never exercised.
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

export default i18n;
