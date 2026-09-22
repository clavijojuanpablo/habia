import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

const deviceLanguage = getLocales()[0]?.languageCode ?? 'es';

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLanguage) ? deviceLanguage : 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
