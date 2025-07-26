// src/cli.ts - 命令行接口实现

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { FlexibleScaffold } from './FlexibleScaffold';
import type { OperationResult } from './types';
import { logger } from './utils';
import { t, getCurrentLanguage, getAvailableLanguages, setLanguage } from './i18n';

export class CLI {
  private scaffold: FlexibleScaffold;
  private program: Command;

  constructor() {
    this.scaffold = new FlexibleScaffold();
    this.program = new Command();
  }

  private setupCommands(): void {
    const packageJson = require('../package.json');
    
    this.program
      .name('flexible-scaffold')
      .description(t('cli.description'))
      .version(packageJson.version)
      .option('--lang <language>', 'Set language (en/zh)');

    // 添加模板命令
    this.program
      .command('add')
      .description(t('cli.commands.add'))
      .argument('<name>', t('common.template') + ' ' + t('common.name'))
      .argument('<source>', 'Git URL or local directory path')
      .option('-d, --description <desc>', t('cli.options.description'))
      .action(async (name: string, source: string, options: { description?: string }) => {
        // 处理语言选项
        this.handleLanguageOption(this.program.opts());
        
        const result = await this.scaffold.addTemplate(name, source, options.description);
        this.handleResult(result);
      });

    // 删除模板命令
    this.program
      .command('remove')
      .alias('rm')
      .description(t('cli.commands.remove'))
      .argument('<name>', t('common.template') + ' ' + t('common.name'))
      .action(async (name: string) => {
        // 处理语言选项
        this.handleLanguageOption(this.program.opts());
        
        const result = this.scaffold.removeTemplate(name);
        this.handleResult(result);
      });

    // 更新模板命令
    this.program
      .command('update')
      .description(t('cli.commands.update'))
      .argument('[name]', t('common.template') + ' ' + t('common.name') + ' (optional, updates all if not specified)')
      .action(async (name?: string) => {
        // 处理语言选项
        this.handleLanguageOption(this.program.opts());
        
        if (name) {
          const result = await this.scaffold.updateTemplate(name);
          this.handleResult(result);
        } else {
          const result = await this.scaffold.updateAllTemplates();
          this.handleResult(result);
        }
      });

    // 列出模板命令
    this.program
      .command('list')
      .alias('ls')
      .description(t('cli.commands.list'))
      .option('-j, --json', t('cli.options.json'))
      .action(async (options: { json?: boolean }) => {
        // 处理语言选项
        this.handleLanguageOption(this.program.opts());
        
        const result = this.scaffold.listTemplates();
        
        if (options.json || process.env.SCAFFOLD_JSON_OUTPUT === 'true') {
          console.log(JSON.stringify(result, null, 2));
        } else {
          this.handleResult(result);
        }
      });

    // 创建项目命令
    this.program
      .command('create')
      .description(t('cli.commands.create'))
      .argument('<template-name>', t('common.template') + ' ' + t('common.name'))
      .argument('<project-name>', t('common.project') + ' ' + t('common.name'))
      .option('-d, --dir <directory>', t('cli.options.directory'), '.')
      .option('-i, --interactive', t('cli.options.interactive'))
      .action(async (templateName: string, projectName: string, options: { dir?: string; interactive?: boolean }) => {
        // 处理语言选项
        this.handleLanguageOption(this.program.opts());
        
        if (options.interactive) {
          await this.interactiveCreate();
        } else {
          const result = await this.scaffold.createProject({
            templateName,
            projectName,
            targetDir: options.dir,
          });
          this.handleResult(result);
        }
      });

    // 信息命令
    this.program
      .command('info')
      .description(t('cli.commands.info'))
      .argument('<name>', t('common.template') + ' ' + t('common.name'))
      .option('-j, --json', t('cli.options.json'))
      .action(async (name: string, options: { json?: boolean }) => {
        const result = this.scaffold.getTemplateInfo(name);
        
        if (options.json || process.env.SCAFFOLD_JSON_OUTPUT === 'true') {
          console.log(JSON.stringify(result, null, 2));
        } else if (result.success && result.data) {
          this.displayTemplateInfo(name, result.data);
        } else {
          this.handleResult(result);
        }
      });

    // 验证命令
    this.program
      .command('validate')
      .description(t('cli.commands.validate'))
      .argument('<name>', t('common.template') + ' ' + t('common.name'))
      .action(async (name: string) => {
        const result = this.scaffold.validateTemplate(name);
        this.handleResult(result);
      });

    // 清理命令
    this.program
      .command('cleanup')
      .description(t('cli.commands.cleanup'))
      .action(async () => {
        const result = this.scaffold.cleanupInvalidTemplates();
        this.handleResult(result);
      });

    // 配置命令
    this.program
      .command('config')
      .description(t('cli.commands.config'))
      .option('-s, --show', t('cli.options.show'))
      .option('-p, --path', t('cli.options.path'))
      .option('--export <file>', t('cli.options.export'))
      .option('--import <file>', t('cli.options.import'))
      .action(async (options: { 
        show?: boolean; 
        path?: boolean; 
        export?: string; 
        import?: string; 
      }) => {
        if (options.show) {
          const result = this.scaffold.exportConfig();
          if (result.success) {
            console.log(JSON.stringify(result.data, null, 2));
          } else {
            this.handleResult(result);
          }
        } else if (options.path) {
          console.log(`${t('cli.messages.config_directory')} ${this.scaffold.getConfigDir()}`);
          console.log(`${t('cli.messages.templates_directory')} ${this.scaffold.getTemplatesDir()}`);
        } else if (options.export) {
          await this.exportConfig(options.export);
        } else if (options.import) {
          await this.importConfig(options.import);
        } else {
          logger.info(t('cli.messages.use_help'));
        }
      });

    // 交互式主命令
    this.program
      .command('interactive')
      .alias('i')
      .description(t('cli.commands.interactive'))
      .action(async () => {
        await this.interactiveMode();
      });

    // MCP 服务器命令
    this.program
      .command('mcp')
      .description(t('cli.commands.mcp'))
      .option('--stdio', t('cli.options.stdio'))
      .option('--port <port>', t('cli.options.port'))
      .option('--host <host>', t('cli.options.host'), 'localhost')
      .action(async (options: { stdio?: boolean; port?: string; host?: string }) => {
        try {
          const { createScaffoldMCPServer } = await import('./mcp-scaffold-server');
          
          if (options.port) {
            // HTTP模式需要额外依赖，暂不支持
            logger.error('HTTP传输模式暂不支持，请使用 --stdio 模式');
            process.exit(1);
          }
          
          // 默认使用stdio模式
          await createScaffoldMCPServer();
        } catch (error) {
          logger.error(`启动MCP服务器失败: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
  }

  /**
   * 交互式创建项目
   */
  private async interactiveCreate(): Promise<void> {
    try {
      const templatesResult = this.scaffold.listTemplates();
      
      if (!templatesResult.success || !templatesResult.templates || templatesResult.templates.length === 0) {
        logger.error(t('cli.messages.no_templates'));
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'templateName',
          message: '选择项目模板:',
          choices: templatesResult.templates.map(template => ({
            name: `${template.name} - ${template.description}`,
            value: template.name,
          })),
        },
        {
          type: 'input',
          name: 'projectName',
          message: '输入项目名称:',
          validate: (input: string) => {
            if (!input.trim()) return '项目名称不能为空';
            if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
              return '项目名称只能包含字母、数字、连字符和下划线';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'targetDir',
          message: '目标目录:',
          default: '.',
        },
      ]);

      const result = await this.scaffold.createProject({
        templateName: answers.templateName,
        projectName: answers.projectName,
        targetDir: answers.targetDir,
      });

      this.handleResult(result);
    } catch (error) {
      logger.error(`交互式创建失败: ${error}`);
    }
  }

  /**
   * 交互式主界面
   */
  private async interactiveMode(): Promise<void> {
    console.log(chalk.blue.bold(`\n${t('cli.interactive.title')}\n`));

    while (true) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: t('cli.messages.select_action'),
            choices: [
              { name: t('cli.interactive.view_templates'), value: 'list' },
              { name: t('cli.interactive.add_template'), value: 'add' },
              { name: t('cli.interactive.create_project'), value: 'create' },
              { name: t('cli.interactive.update_template'), value: 'update' },
              { name: t('cli.interactive.remove_template'), value: 'remove' },
              { name: t('cli.interactive.template_info'), value: 'info' },
              { name: t('cli.interactive.cleanup_templates'), value: 'cleanup' },
              { name: t('cli.interactive.view_config'), value: 'config' },
              { name: t('cli.interactive.exit'), value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') {
          console.log(chalk.blue(t('cli.interactive.goodbye')));
          break;
        }

        await this.handleInteractiveAction(action);
        
        // 操作完成后暂停
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: t('cli.interactive.continue'),
        }]);

      } catch (error) {
        const err = error as { isTtyError?: boolean; message?: string };
        if (err.isTtyError || (err.message && err.message.includes('User force closed'))) {
          console.log(chalk.blue(`\n${t('cli.interactive.goodbye')}`));
          break;
        }
        logger.error(`操作失败: ${error}`);
      }
    }
  }

  /**
   * 处理交互式操作
   */
  private async handleInteractiveAction(action: string): Promise<void> {
    switch (action) {
      case 'list':
        this.scaffold.listTemplates();
        break;

      case 'add':
        await this.interactiveAddTemplate();
        break;

      case 'create':
        await this.interactiveCreate();
        break;

      case 'update':
        await this.interactiveUpdateTemplate();
        break;

      case 'remove':
        await this.interactiveRemoveTemplate();
        break;

      case 'info':
        await this.interactiveTemplateInfo();
        break;

      case 'cleanup':
        const cleanupResult = this.scaffold.cleanupInvalidTemplates();
        this.handleResult(cleanupResult);
        break;

      case 'config':
        console.log(`配置目录: ${this.scaffold.getConfigDir()}`);
        console.log(`模板目录: ${this.scaffold.getTemplatesDir()}`);
        break;
    }
  }

  /**
   * 交互式添加模板
   */
  private async interactiveAddTemplate(): Promise<void> {
    const { templateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateType',
        message: t('cli.messages.select_template_type'),
        choices: [
          { name: t('cli.messages.template_type_git'), value: 'git' },
          { name: t('cli.messages.template_type_local'), value: 'local' },
        ],
      },
    ]);

    const commonQuestions = [
      {
        type: 'input',
        name: 'name',
        message: t('cli.messages.input_template_name'),
        validate: (input: string) => input.trim() !== '' || t('validation.name_required'),
      },
      {
        type: 'input',
        name: 'description',
        message: t('cli.messages.input_description'),
      },
    ];

    let sourceQuestion;
    if (templateType === 'git') {
      sourceQuestion = {
        type: 'input',
        name: 'source',
        message: t('cli.messages.input_git_url'),
        validate: (input: string) => {
          if (!input.trim()) return t('validation.url_required');
          if (!/^(https?:\/\/)|(git@)|(ssh:\/\/)/.test(input)) {
            return t('cli.messages.git_url_invalid');
          }
          return true;
        },
      };
    } else {
      sourceQuestion = {
        type: 'input',
        name: 'source',
        message: t('cli.messages.input_local_path'),
        validate: (input: string) => {
          if (!input.trim()) return t('validation.path_required');
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(input.trim());
          if (!fs.existsSync(fullPath)) return t('cli.messages.local_path_not_exist');
          if (!fs.statSync(fullPath).isDirectory()) return t('cli.messages.local_path_not_directory');
          return true;
        },
      };
    }

    const questions = [...commonQuestions, sourceQuestion];
    const answers = await inquirer.prompt(questions);

    const result = await this.scaffold.addTemplate(
      answers.name,
      answers.source,
      answers.description
    );
    this.handleResult(result);
  }

  /**
   * 交互式更新模板
   */
  private async interactiveUpdateTemplate(): Promise<void> {
    const templatesResult = this.scaffold.listTemplates();
    
    if (!templatesResult.success || !templatesResult.templates || templatesResult.templates.length === 0) {
      logger.error(t('cli.messages.no_templates'));
      return;
    }

    const choices = [
      { name: '🔄 ' + t('cli.interactive.update_template'), value: '__all__' },
      ...templatesResult.templates.map(template => ({
        name: `${template.name} - ${template.description}`,
        value: template.name,
      })),
    ];

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: t('cli.messages.select_template') + ' ' + t('common.update'),
        choices,
      },
    ]);

    if (templateName === '__all__') {
      const result = await this.scaffold.updateAllTemplates();
      this.handleResult(result);
    } else {
      const result = await this.scaffold.updateTemplate(templateName);
      this.handleResult(result);
    }
  }

  /**
   * 交互式删除模板
   */
  private async interactiveRemoveTemplate(): Promise<void> {
    const templatesResult = this.scaffold.listTemplates();
    
    if (!templatesResult.success || !templatesResult.templates || templatesResult.templates.length === 0) {
      logger.error(t('cli.messages.no_templates'));
      return;
    }

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: t('cli.messages.select_template') + ' ' + t('common.remove'),
        choices: templatesResult.templates.map(template => ({
          name: `${template.name} - ${template.description}`,
          value: template.name,
        })),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: t('cli.messages.confirm_delete').replace('{name}', templateName),
        default: false,
      },
    ]);

    if (confirm) {
      const result = this.scaffold.removeTemplate(templateName);
      this.handleResult(result);
    } else {
      logger.info(t('cli.messages.operation_cancelled'));
    }
  }

  /**
   * 交互式查看模板信息
   */
  private async interactiveTemplateInfo(): Promise<void> {
    const templatesResult = this.scaffold.listTemplates();
    
    if (!templatesResult.success || !templatesResult.templates || templatesResult.templates.length === 0) {
      logger.error(t('cli.messages.no_templates'));
      return;
    }

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: t('cli.messages.select_template') + ' ' + t('common.view'),
        choices: templatesResult.templates.map(template => ({
          name: `${template.name} - ${template.description}`,
          value: template.name,
        })),
      },
    ]);

    const result = this.scaffold.getTemplateInfo(templateName);
    if (result.success && result.data) {
      this.displayTemplateInfo(templateName, result.data);
    } else {
      this.handleResult(result);
    }
  }

  /**
   * 显示模板详细信息
   */
  private displayTemplateInfo(name: string, template: any): void {
    console.log(chalk.blue.bold(`\n📋 ${t('mcp.messages.template_info').replace('{name}', name)}\n`));
    console.log(`📝 ${t('common.description')}: ${template.description || t('common.optional')}`);
    console.log(`📅 ${t('common.date')}: ${new Date(template.addedAt).toLocaleString()}`);
    
    if (template.type === 'git') {
      console.log(`🔗 Git ${t('common.url')}: ${template.gitUrl}`);
    } else {
      console.log(`📁 ${t('common.source')} ${t('common.path')}: ${template.sourcePath}`);
      console.log(`🏷️  ${t('common.type')}: ${t('common.local')} ${t('common.template')}`);
    }
    
    if (template.updatedAt) {
      console.log(`🔄 ${t('common.last')} ${t('common.update')}: ${new Date(template.updatedAt).toLocaleString()}`);
    }
    
    if (template.config?.tags) {
      console.log(`🏷️  ${t('common.tags')}: ${template.config.tags.join(', ')}`);
    }
    
    if (template.config?.postCreateInstructions) {
      console.log(`\n📝 ${t('common.create')} ${t('common.after')} ${t('common.instructions')}:`);
      template.config.postCreateInstructions.forEach((instruction: string) => {
        console.log(`  • ${instruction}`);
      });
    }
    
    console.log(`📁 ${t('common.local')} ${t('common.path')}: ${template.localPath}`);
  }

  /**
   * 导出配置
   */
  private async exportConfig(filePath: string): Promise<void> {
    try {
      const result = this.scaffold.exportConfig();
      if (result.success) {
        const fs = await import('fs');
        fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
        logger.success(`${t('common.configuration')} ${t('common.export')} ${t('common.to')}: ${filePath}`);
      } else {
        this.handleResult(result);
      }
    } catch (error) {
      logger.error(`导出配置失败: ${error}`);
    }
  }

  /**
   * 导入配置
   */
  private async importConfig(filePath: string): Promise<void> {
    try {
      const fs = await import('fs');
      const configContent = fs.readFileSync(filePath, 'utf8');
      const importConfig = JSON.parse(configContent);
      
      const result = this.scaffold.importConfig(importConfig);
      this.handleResult(result);
    } catch (error) {
      logger.error(`导入配置失败: ${error}`);
    }
  }

  /**
   * 处理操作结果
   */
  private handleResult(result: OperationResult): void {
    if (process.env.SCAFFOLD_JSON_OUTPUT === 'true') {
      console.log(JSON.stringify(result));
      return;
    }

    if (result.success) {
      if (result.message) {
        logger.success(result.message);
      }
    } else {
      if (result.error) {
        logger.error(result.error);
      }
      process.exit(1);
    }
  }

  /**
   * 处理语言选项
   */
  private handleLanguageOption(options: any): void {
    if (options.lang) {
      const { setLanguage } = require('./i18n');
      setLanguage(options.lang);
    }
  }

  /**
   * 运行CLI
   */
  public async run(argv: string[]): Promise<void> {
    // 解析参数以处理语言选项
    const parsed = this.program.parseOptions(argv);
    
    if (parsed.unknown && parsed.unknown.includes('--lang')) {
      const langIndex = parsed.unknown.indexOf('--lang');
      if (langIndex !== -1 && langIndex + 1 < parsed.unknown.length) {
        const lang = parsed.unknown[langIndex + 1];
        const { setLanguage } = require('./i18n');
        await setLanguage(lang);
      }
    }
    
    // 设置命令
    this.setupCommands();
    
    await this.program.parseAsync(argv);
  }
}