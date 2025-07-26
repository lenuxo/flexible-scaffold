// src/i18n/config.ts - 国际化配置管理

import { Language } from './types';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils';

export class I18nConfig {
  private static instance: I18nConfig;
  private configPath: string;
  private config: {
    language: Language;
    fallbackLanguage: Language;
  };

  private constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    this.configPath = path.join(homeDir, '.scaffold', 'config.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): I18nConfig {
    if (!I18nConfig.instance) {
      I18nConfig.instance = new I18nConfig();
    }
    return I18nConfig.instance;
  }

  private loadConfig(): { language: Language; fallbackLanguage: Language } {
    const defaultConfig = {
      language: this.detectLanguage(),
      fallbackLanguage: 'en' as Language
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return {
          language: this.validateLanguage(configData.language) || defaultConfig.language,
          fallbackLanguage: this.validateLanguage(configData.fallbackLanguage) || defaultConfig.fallbackLanguage
        };
      }
    } catch (error) {
      logger.error(`加载国际化配置失败: ${error}`);
    }

    return defaultConfig;
  }

  private detectLanguage(): Language {
    // 优先级：环境变量 > CLI参数 > 系统语言 > 默认英文
    
    // 1. 环境变量
    const envLang = process.env.SCAFFOLD_LANG || process.env.LANG;
    if (envLang) {
      if (envLang.startsWith('zh')) return 'zh';
      if (envLang.startsWith('en')) return 'en';
    }

    // 2. CLI参数
    const cliArgs = process.argv.slice(2);
    const langIndex = cliArgs.indexOf('--lang');
    if (langIndex !== -1 && cliArgs[langIndex + 1]) {
      const cliLang = cliArgs[langIndex + 1];
      if (this.validateLanguage(cliLang)) {
        return cliLang as Language;
      }
    }

    // 3. 系统语言检测
    const systemLang = Intl.DateTimeFormat().resolvedOptions().locale;
    if (systemLang.startsWith('zh')) return 'zh';

    // 4. 默认英文
    return 'en';
  }

  private validateLanguage(lang: string): Language | null {
    if (lang === 'en' || lang === 'zh') {
      return lang as Language;
    }
    return null;
  }

  public getLanguage(): Language {
    return this.config.language;
  }

  public setLanguage(language: Language): void {
    this.config.language = language;
    this.saveConfig();
  }

  public getFallbackLanguage(): Language {
    return this.config.fallbackLanguage;
  }

  public getAvailableLanguages(): Language[] {
    return ['en', 'zh'];
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // 读取现有配置并合并
      let existingConfig = {};
      if (fs.existsSync(this.configPath)) {
        existingConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }

      const newConfig = {
        ...existingConfig,
        language: this.config.language,
        fallbackLanguage: this.config.fallbackLanguage
      };

      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
    } catch (error) {
      logger.error(`保存国际化配置失败: ${error}`);
    }
  }
}