import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en/translation.json';
import kuTranslations from '../locales/ku/translation.json';
import arTranslations from '../locales/ar/translation.json';

// Get saved language from localStorage or default to 'en'
// Use a safe check for browser environment
const getSavedLanguage = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('language') || 'en';
    } catch {
      return 'en';
    }
  }
  return 'en';
};

const savedLanguage = getSavedLanguage();

// Initialize i18n
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslations,
        },
        ku: {
          translation: kuTranslations,
        },
        ar: {
          translation: arTranslations,
        },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable suspense to prevent loading issues
      },
    });
}

// Update HTML direction and language attributes
const updateHtmlAttributes = (lang: string) => {
  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    
    // Set direction: RTL for Kurdish and Arabic, LTR for English
    if (lang === 'ku' || lang === 'ar') {
      html.setAttribute('dir', 'rtl');
    } else {
      html.setAttribute('dir', 'ltr');
    }
  }
};

// Initialize HTML attributes only in browser
if (typeof window !== 'undefined') {
  // Use requestAnimationFrame to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateHtmlAttributes(savedLanguage);
    });
  } else {
    updateHtmlAttributes(savedLanguage);
  }
  
  // Listen for language changes
  i18n.on('languageChanged', (lng) => {
    updateHtmlAttributes(lng);
    try {
      if (window.localStorage) {
        localStorage.setItem('language', lng);
      }
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  });
}

export default i18n;

