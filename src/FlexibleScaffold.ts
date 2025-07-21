// src/FlexibleScaffold.ts - 主要功能类

import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ScaffoldConfig,
  TemplateInfo,
  TemplateConfig,
  OperationResult,
  CreateProjectOptions,
  CreateProjectResult,
  ListTemplatesResult,
  TemplateVariables,
} from './types';
import {
  ensureDir,
  pathExists,
  removeDir,
  copyDir,
  executeCommand,
  safeExecuteCommand,
  processTemplateVariables,
  cleanGitFiles,
  cleanScaffoldFiles,
  isValidGitUrl,
  isValidProjectName,
  getCurrentTimestamp,
  generateDefaultVariables,
  logger,
  withSpinner,
  readJsonFile,
  writeJsonFile,
  safeReadJsonFile,
} from './utils';

export class FlexibleScaffold {
  private configDir: string;
  private configFile: string;
  private templatesDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.flexible-scaffold');
    this.configFile = path.join(this.configDir, 'templates.json');
    this.templatesDir = path.join(this.configDir, 'templates');
    this.init();
  }

  /**
   * 初始化配置目录和文件
   */
  private init(): void {
    ensureDir(this.configDir);
    ensureDir(this.templatesDir);

    if (!pathExists(this.configFile)) {
      const defaultConfig: ScaffoldConfig = {
        templates: {},
        lastUpdated: getCurrentTimestamp(),
      };
      writeJsonFile(this.configFile, defaultConfig);
    }
  }

  /**
   * 加载配置文件
   */
  public loadConfig(): ScaffoldConfig {
    const defaultConfig: ScaffoldConfig = {
      templates: {},
      lastUpdated: getCurrentTimestamp(),
    };
    return safeReadJsonFile(this.configFile, defaultConfig);
  }

  /**
   * 保存配置文件
   */
  private saveConfig(config: ScaffoldConfig): void {
    config.lastUpdated = getCurrentTimestamp();
    writeJsonFile(this.configFile, config);
  }

  /**
   * 加载模板配置
   */
  private loadTemplateConfig(templatePath: string): TemplateConfig | undefined {
    const configPaths = [
      path.join(templatePath, 'scaffold.config.js'),
      path.join(templatePath, 'scaffold.config.ts'),
    ];

    for (const configPath of configPaths) {
      if (pathExists(configPath)) {
        try {
          // 清除 require 缓存
          delete require.cache[require.resolve(configPath)];
          return require(configPath);
        } catch (error) {
          logger.warning(`无法加载模板配置文件 ${configPath}: ${error}`);
        }
      }
    }

    return undefined;
  }

  /**
   * 添加模板
   */
  public async addTemplate(
    name: string,
    gitUrl: string,
    description = ''
  ): Promise<OperationResult> {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    if (!isValidGitUrl(gitUrl)) {
      return { success: false, error: '无效的 Git URL 格式' };
    }

    try {
      const config = this.loadConfig();
      const templatePath = path.join(this.templatesDir, name);

      logger.info(`添加模板: ${name}`);
      logger.info(`Git URL: ${gitUrl}`);

      // 如果本地已存在，先删除
      if (pathExists(templatePath)) {
        removeDir(templatePath);
      }

      // 克隆模板
      await withSpinner(
        '克隆模板仓库...',
        async () => {
          executeCommand(`git clone "${gitUrl}" "${templatePath}"`);
        }
      );

      // 读取模板配置
      const templateConfig = this.loadTemplateConfig(templatePath);

      // 更新配置
      config.templates[name] = {
        gitUrl,
        description: description || templateConfig?.description || '',
        localPath: templatePath,
        addedAt: getCurrentTimestamp(),
        config: templateConfig,
      };

      this.saveConfig(config);
      logger.success(`模板 "${name}" 添加成功`);

      return {
        success: true,
        message: `模板 ${name} 添加成功`,
        data: { name, gitUrl, description },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`添加模板失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 删除模板
   */
  public removeTemplate(name: string): OperationResult {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    try {
      const config = this.loadConfig();

      if (!config.templates[name]) {
        return { success: false, error: `模板 "${name}" 不存在` };
      }

      const templatePath = config.templates[name].localPath;

      // 删除本地文件
      if (pathExists(templatePath)) {
        removeDir(templatePath);
      }

      // 更新配置
      delete config.templates[name];
      this.saveConfig(config);

      logger.success(`模板 "${name}" 删除成功`);
      return { success: true, message: `模板 ${name} 删除成功` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`删除模板失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 更新模板
   */
  public async updateTemplate(name: string): Promise<OperationResult> {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    try {
      const config = this.loadConfig();

      if (!config.templates[name]) {
        return { success: false, error: `模板 "${name}" 不存在` };
      }

      const template = config.templates[name];
      const templatePath = template.localPath;

      logger.info(`更新模板: ${name}`);

      // 删除旧版本
      if (pathExists(templatePath)) {
        removeDir(templatePath);
      }

      // 重新克隆
      await withSpinner(
        '更新模板仓库...',
        async () => {
          executeCommand(`git clone "${template.gitUrl}" "${templatePath}"`);
        }
      );

      // 重新加载配置
      const templateConfig = this.loadTemplateConfig(templatePath);
      template.config = templateConfig;
      template.updatedAt = getCurrentTimestamp();

      this.saveConfig(config);
      logger.success(`模板 "${name}" 更新成功`);

      return { success: true, message: `模板 ${name} 更新成功` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`更新模板失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 列出所有模板
   */
  public listTemplates(): ListTemplatesResult {
    try {
      const config = this.loadConfig();
      const templateNames = Object.keys(config.templates);

      if (templateNames.length === 0) {
        logger.info('暂无可用模板');
        return { success: true, templates: [] };
      }

      logger.info('可用模板列表:');
      console.log('');

      const templates = templateNames.map(name => {
        const template = config.templates[name];
        
        console.log(`🔹 ${name}`);
        console.log(`   描述: ${template.description || '无描述'}`);
        console.log(`   Git: ${template.gitUrl}`);
        console.log(`   添加时间: ${new Date(template.addedAt).toLocaleString()}`);
        
        if (template.config?.tags) {
          console.log(`   标签: ${template.config.tags.join(', ')}`);
        }
        
        console.log('');

        return {
          name,
          description: template.description || '无描述',
          gitUrl: template.gitUrl,
          addedAt: template.addedAt,
          tags: template.config?.tags,
        };
      });

      return { success: true, templates };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`获取模板列表失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 创建项目
   */
  public async createProject(options: CreateProjectOptions): Promise<CreateProjectResult> {
    const { templateName, projectName, targetDir = '.', variables } = options;

    if (!templateName.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    if (!isValidProjectName(projectName)) {
      return { success: false, error: '项目名称只能包含字母、数字、连字符和下划线' };
    }

    try {
      const config = this.loadConfig();

      if (!config.templates[templateName]) {
        return { success: false, error: `模板 "${templateName}" 不存在` };
      }

      const template = config.templates[templateName];
      const templatePath = template.localPath;
      const projectPath = path.resolve(targetDir, projectName);

      logger.info(`创建项目: ${projectName}`);
      logger.info(`使用模板: ${templateName}`);

      // 检查目标目录是否存在
      if (pathExists(projectPath)) {
        return { success: false, error: `目录 "${projectName}" 已存在` };
      }

      // 复制模板文件
      await withSpinner(
        '复制模板文件...',
        async () => {
          copyDir(templatePath, projectPath);
        }
      );

      // 清理 Git 和配置文件
      cleanGitFiles(projectPath);
      cleanScaffoldFiles(projectPath);

      // 生成模板变量
      const templateVariables: TemplateVariables = {
        ...generateDefaultVariables(projectName),
        ...variables,
      };

      // 处理模板变量替换
      await withSpinner(
        '处理模板变量...',
        async () => {
          processTemplateVariables(projectPath, templateVariables);
        }
      );

      // 执行后处理脚本
      if (template.config?.postProcess) {
        await this.executePostProcess(projectPath, template.config.postProcess);
      }

      logger.success(`项目 "${projectName}" 创建成功!`);
      logger.info(`项目路径: ${projectPath}`);

      // 显示后续操作说明
      if (template.config?.postCreateInstructions) {
        console.log('\n📝 下一步操作:');
        template.config.postCreateInstructions.forEach(instruction => {
          console.log(`  ${instruction.replace(/{{PROJECT_NAME}}/g, projectName)}`);
        });
      } else {
        console.log('\n📝 下一步操作:');
        console.log(`  cd ${projectName}`);
        console.log('  npm install');
        console.log('  npm run dev');
      }

      return {
        success: true,
        message: `项目 ${projectName} 创建成功`,
        projectPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`创建项目失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 执行后处理脚本
   */
  private async executePostProcess(projectPath: string, commands: string[]): Promise<void> {
    const originalCwd = process.cwd();

    try {
      process.chdir(projectPath);

      for (const command of commands) {
        await withSpinner(
          `执行: ${command}`,
          async () => {
            executeCommand(command);
          }
        );
      }
    } catch (error) {
      logger.warning(`后处理脚本执行失败: ${error}`);
    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * 获取模板信息
   */
  public getTemplateInfo(name: string): OperationResult<TemplateInfo> {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    try {
      const config = this.loadConfig();
      const template = config.templates[name];

      if (!template) {
        return { success: false, error: `模板 "${name}" 不存在` };
      }

      return { success: true, data: template };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取配置目录路径
   */
  public getConfigDir(): string {
    return this.configDir;
  }

  /**
   * 获取模板目录路径
   */
  public getTemplatesDir(): string {
    return this.templatesDir;
  }

  /**
   * 验证模板是否可用
   */
  public validateTemplate(name: string): OperationResult {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' };
    }

    const config = this.loadConfig();
    const template = config.templates[name];

    if (!template) {
      return { success: false, error: `模板 "${name}" 不存在` };
    }

    if (!pathExists(template.localPath)) {
      return { success: false, error: `模板本地路径不存在: ${template.localPath}` };
    }

    return { success: true, message: `模板 "${name}" 可用` };
  }

  /**
   * 批量操作：更新所有模板
   */
  public async updateAllTemplates(): Promise<OperationResult> {
    try {
      const config = this.loadConfig();
      const templateNames = Object.keys(config.templates);

      if (templateNames.length === 0) {
        return { success: true, message: '没有模板需要更新' };
      }

      logger.info(`开始更新 ${templateNames.length} 个模板...`);

      const results = await Promise.allSettled(
        templateNames.map(name => this.updateTemplate(name))
      );

      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      const failed = results.length - successful;

      if (failed === 0) {
        logger.success(`所有 ${successful} 个模板更新成功`);
        return { success: true, message: `成功更新 ${successful} 个模板` };
      } else {
        logger.warning(`${successful} 个模板更新成功，${failed} 个失败`);
        return { 
          success: false, 
          error: `部分模板更新失败：${successful}/${results.length} 成功` 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`批量更新模板失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 清理无效模板
   */
  public cleanupInvalidTemplates(): OperationResult {
    try {
      const config = this.loadConfig();
      const templateNames = Object.keys(config.templates);
      let cleanedCount = 0;

      for (const name of templateNames) {
        const template = config.templates[name];
        if (!pathExists(template.localPath)) {
          delete config.templates[name];
          cleanedCount++;
          logger.info(`清理无效模板: ${name}`);
        }
      }

      if (cleanedCount > 0) {
        this.saveConfig(config);
        logger.success(`清理了 ${cleanedCount} 个无效模板`);
      } else {
        logger.info('没有发现无效模板');
      }

      return { 
        success: true, 
        message: `清理了 ${cleanedCount} 个无效模板`,
        data: { cleanedCount }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`清理无效模板失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 导出配置
   */
  public exportConfig(): OperationResult<ScaffoldConfig> {
    try {
      const config = this.loadConfig();
      return { success: true, data: config };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 导入配置
   */
  public importConfig(importConfig: ScaffoldConfig): OperationResult {
    try {
      const currentConfig = this.loadConfig();
      
      // 合并配置，保留现有模板
      const mergedConfig: ScaffoldConfig = {
        ...currentConfig,
        templates: {
          ...currentConfig.templates,
          ...importConfig.templates,
        },
      };

      this.saveConfig(mergedConfig);
      
      const importedCount = Object.keys(importConfig.templates).length;
      logger.success(`成功导入 ${importedCount} 个模板配置`);
      
      return { 
        success: true, 
        message: `成功导入 ${importedCount} 个模板配置`,
        data: { importedCount }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`导入配置失败: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}