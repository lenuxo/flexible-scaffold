// src/i18n/types.ts - 国际化类型定义

export type Language = 'en' | 'zh';

export interface TranslationKey {
  [key: string]: string | TranslationKey;
}

export interface I18nConfig {
  language: Language;
  fallbackLanguage: Language;
}

export interface I18nManager {
  t(key: string, params?: Record<string, string | number>): string;
  setLanguage(lang: Language): void;
  getCurrentLanguage(): Language;
  getAvailableLanguages(): Language[];
}