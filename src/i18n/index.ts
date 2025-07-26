// src/i18n/index.ts - 国际化核心管理器

import { Language, TranslationKey, I18nManager } from './types';
import { I18nConfig } from './config';
import { logger } from '../utils';

// 同步加载语言包
const loadLocaleSync = (lang: Language): TranslationKey => {
  try {
    const path = require('path');
    const fs = require('fs');
    const localePath = path.join(__dirname, 'locales', `${lang}.json`);
    if (fs.existsSync(localePath)) {
      const data = fs.readFileSync(localePath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    // 如果加载失败，尝试加载英文包
    if (lang !== 'en') {
      return loadLocaleSync('en');
    }
    return {};
  }
};

class I18n implements I18nManager {
  private currentLanguage: Language;
  private fallbackLanguage: Language;
  private locales: Map<Language, TranslationKey> = new Map();
  private config: I18nConfig;

  constructor() {
    this.config = I18nConfig.getInstance();
    this.currentLanguage = this.config.getLanguage();
    this.fallbackLanguage = this.config.getFallbackLanguage();
    
    // 同步预加载语言包
    this.locales.set(this.currentLanguage, loadLocaleSync(this.currentLanguage));
    this.locales.set(this.fallbackLanguage, loadLocaleSync(this.fallbackLanguage));
  }

  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;
    
    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? String(value) : match;
    });
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const currentLocale = this.locales.get(this.currentLanguage);
    const fallbackLocale = this.locales.get(this.fallbackLanguage);
    
    let text = this.getNestedValue(currentLocale, key);
    
    if (!text && this.currentLanguage !== this.fallbackLanguage) {
      text = this.getNestedValue(fallbackLocale, key);
    }
    
    if (!text) {
      // 如果找不到翻译，返回key本身
      return key;
    }
    
    return this.interpolate(text, params);
  }

  public async setLanguage(lang: Language): Promise<void> {
    if (!this.config.getAvailableLanguages().includes(lang)) {
      logger.error(`不支持的语言: ${lang}`);
      return;
    }

    if (lang !== this.currentLanguage) {
      this.currentLanguage = lang;
      
      // 同步加载语言包
      if (!this.locales.has(lang)) {
        this.locales.set(lang, loadLocaleSync(lang));
      }
      
      // 保存配置
      this.config.setLanguage(lang);
    }
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public getAvailableLanguages(): Language[] {
    return this.config.getAvailableLanguages();
  }

  public async switchLanguage(lang: Language): Promise<void> {
    await this.setLanguage(lang);
  }

  public getLanguageDisplayName(lang: Language): string {
    const names = {
      'en': 'English',
      'zh': '中文'
    };
    return names[lang] || lang;
  }
}

// 创建单例实例
const i18n = new I18n();

// 导出便捷的翻译函数
export const t = (key: string, params?: Record<string, string | number>): string => {
  return i18n.t(key, params);
};

// 导出语言切换函数
export const setLanguage = async (lang: Language): Promise<void> => {
  await i18n.setLanguage(lang);
};

// 导出当前语言
export const getCurrentLanguage = (): Language => {
  return i18n.getCurrentLanguage();
};

// 导出可用语言
export const getAvailableLanguages = (): Language[] => {
  return i18n.getAvailableLanguages();
};

// 导出语言显示名称
export const getLanguageDisplayName = (lang: Language): string => {
  return i18n.getLanguageDisplayName(lang);
};

// 导出i18n实例
export { i18n };

// 默认导出翻译函数
export default t;