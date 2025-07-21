// src/utils/index.ts - 工具函数

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import type { TemplateVariables } from '../types';

/**
 * 确保目录存在，如果不存在则创建
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 检查路径是否存在
 */
export function pathExists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

/**
 * 删除目录及其内容
 */
export function removeDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    execSync(`rm -rf "${dirPath}"`);
  }
}

/**
 * 复制目录
 */
export function copyDir(source: string, destination: string): void {
  execSync(`cp -r "${source}" "${destination}"`);
}

/**
 * 执行命令
 */
export function executeCommand(command: string, options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }): void {
  const execOptions = {
    stdio: options?.stdio || 'inherit' as const,
    cwd: options?.cwd || process.cwd(),
  };
  
  execSync(command, execOptions);
}

/**
 * 安全地执行命令，捕获错误
 */
export function safeExecuteCommand(command: string, options?: { cwd?: string }): { success: boolean; error?: string } {
  try {
    executeCommand(command, { ...options, stdio: 'pipe' });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * 处理模板变量替换
 */
export function processTemplateVariables(projectPath: string, variables: TemplateVariables): void {
  const processFile = (filePath: string): void => {
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fs.readdirSync(filePath).forEach(file => {
        processFile(path.join(filePath, file));
      });
    } else {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          if (content.includes(`{{${key}}}`)) {
            content = content.replace(regex, value);
            modified = true;
          }
        });
        
        if (modified) {
          fs.writeFileSync(filePath, content);
        }
      } catch (err) {
        // 跳过二进制文件或无法读取的文件
      }
    }
  };

  processFile(projectPath);
}

/**
 * 清理 Git 相关文件
 */
export function cleanGitFiles(projectPath: string): void {
  const gitDir = path.join(projectPath, '.git');
  if (fs.existsSync(gitDir)) {
    removeDir(gitDir);
  }
}

/**
 * 清理脚手架配置文件
 */
export function cleanScaffoldFiles(projectPath: string): void {
  const scaffoldConfig = path.join(projectPath, 'scaffold.config.js');
  const scaffoldConfigTs = path.join(projectPath, 'scaffold.config.ts');
  
  if (fs.existsSync(scaffoldConfig)) {
    fs.unlinkSync(scaffoldConfig);
  }
  
  if (fs.existsSync(scaffoldConfigTs)) {
    fs.unlinkSync(scaffoldConfigTs);
  }
}

/**
 * 验证 Git URL 格式
 */
export function isValidGitUrl(url: string): boolean {
  const gitUrlRegex = /^(https?:\/\/)|(git@)|(ssh:\/\/)/;
  return gitUrlRegex.test(url);
}

/**
 * 验证项目名称
 */
export function isValidProjectName(name: string): boolean {
  const projectNameRegex = /^[a-zA-Z0-9-_]+$/;
  return projectNameRegex.test(name) && name.length > 0;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * 获取当前时间的 ISO 字符串
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 生成默认模板变量
 */
export function generateDefaultVariables(projectName: string): TemplateVariables {
  return {
    PROJECT_NAME: projectName,
    CURRENT_YEAR: new Date().getFullYear().toString(),
    CREATION_DATE: new Date().toISOString().split('T')[0],
  };
}

/**
 * 日志记录工具
 */
export const logger = {
  info: (message: string) => console.log(chalk.blue('ℹ'), message),
  success: (message: string) => console.log(chalk.green('✅'), message),
  warning: (message: string) => console.log(chalk.yellow('⚠️'), message),
  error: (message: string) => console.log(chalk.red('❌'), message),
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message);
    }
  },
};

/**
 * 进度指示器
 */
export function withSpinner<T>(
  message: string,
  task: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[i]} ${message}`);
      i = (i + 1) % frames.length;
    }, 100);
    
    try {
      const result = await task();
      clearInterval(spinner);
      process.stdout.write('\r✅ ' + message + '\n');
      resolve(result);
    } catch (error) {
      clearInterval(spinner);
      process.stdout.write('\r❌ ' + message + '\n');
      reject(error);
    }
  });
}

/**
 * 读取 JSON 文件
 */
export function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件
 */
export function writeJsonFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * 安全读取 JSON 文件
 */
export function safeReadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    return readJsonFile<T>(filePath);
  } catch {
    return defaultValue;
  }
}