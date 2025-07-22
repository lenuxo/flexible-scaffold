// src/cli.ts - 命令行接口实现

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { FlexibleScaffold } from './FlexibleScaffold';
import type { OperationResult } from './types';
import { logger } from './utils';

export class CLI {
  private scaffold: FlexibleScaffold;
  private program: Command;

  constructor() {
    this.scaffold = new FlexibleScaffold();
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    const packageJson = require('../package.json');
    
    this.program
      .name('flexible-scaffold')
      .description('灵活的项目脚手架工具，支持Git管理的模板')
      .version(packageJson.version);

    // 添加模板命令
    this.program
      .command('add')
      .description('添加新的脚手架模板')
      .argument('<name>', '模板名称')
      .argument('<source>', 'Git仓库URL或本地目录路径')
      .option('-d, --description <desc>', '模板描述')
      .action(async (name: string, source: string, options: { description?: string }) => {
        const result = await this.scaffold.addTemplate(name, source, options.description);
        this.handleResult(result);
      });

    // 删除模板命令
    this.program
      .command('remove')
      .alias('rm')
      .description('删除脚手架模板')
      .argument('<name>', '模板名称')
      .action(async (name: string) => {
        const result = this.scaffold.removeTemplate(name);
        this.handleResult(result);
      });

    // 更新模板命令
    this.program
      .command('update')
      .description('更新脚手架模板')
      .argument('[name]', '模板名称（可选，不指定则更新所有）')
      .action(async (name?: string) => {
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
      .description('列出所有可用模板')
      .option('-j, --json', '以JSON格式输出')
      .action(async (options: { json?: boolean }) => {
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
      .description('使用脚手架模板创建新项目')
      .argument('<template-name>', '模板名称')
      .argument('<project-name>', '项目名称')
      .option('-d, --dir <directory>', '目标目录', '.')
      .option('-i, --interactive', '交互式创建')
      .action(async (templateName: string, projectName: string, options: { dir?: string; interactive?: boolean }) => {
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
      .description('显示模板详细信息')
      .argument('<name>', '模板名称')
      .option('-j, --json', '以JSON格式输出')
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
      .description('验证模板是否可用')
      .argument('<name>', '模板名称')
      .action(async (name: string) => {
        const result = this.scaffold.validateTemplate(name);
        this.handleResult(result);
      });

    // 清理命令
    this.program
      .command('cleanup')
      .description('清理无效的模板')
      .action(async () => {
        const result = this.scaffold.cleanupInvalidTemplates();
        this.handleResult(result);
      });

    // 配置命令
    this.program
      .command('config')
      .description('配置管理')
      .option('-s, --show', '显示当前配置')
      .option('-p, --path', '显示配置路径')
      .option('--export <file>', '导出配置到文件')
      .option('--import <file>', '从文件导入配置')
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
          console.log(`配置目录: ${this.scaffold.getConfigDir()}`);
          console.log(`模板目录: ${this.scaffold.getTemplatesDir()}`);
        } else if (options.export) {
          await this.exportConfig(options.export);
        } else if (options.import) {
          await this.importConfig(options.import);
        } else {
          logger.info('使用 --help 查看配置命令选项');
        }
      });

    // 交互式主命令
    this.program
      .command('interactive')
      .alias('i')
      .description('启动交互式界面')
      .action(async () => {
        await this.interactiveMode();
      });

    // MCP 服务器命令
    this.program
      .command('mcp')
      .description('启动 MCP 服务器')
      .option('--stdio', '使用标准IO传输（默认）')
      .option('--port <port>', '使用HTTP传输的端口')
      .option('--host <host>', '使用HTTP传输的主机', 'localhost')
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
        logger.error('没有可用的模板，请先添加模板');
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
    console.log(chalk.blue.bold('\n🚀 灵活脚手架工具 - 交互式界面\n'));

    while (true) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '请选择操作:',
            choices: [
              { name: '📋 查看所有模板', value: 'list' },
              { name: '➕ 添加新模板', value: 'add' },
              { name: '🚀 创建新项目', value: 'create' },
              { name: '🔄 更新模板', value: 'update' },
              { name: '🗑️  删除模板', value: 'remove' },
              { name: '🔍 查看模板信息', value: 'info' },
              { name: '🧹 清理无效模板', value: 'cleanup' },
              { name: '⚙️  查看配置', value: 'config' },
              { name: '❌ 退出', value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') {
          console.log(chalk.blue('👋 再见！'));
          break;
        }

        await this.handleInteractiveAction(action);
        
        // 操作完成后暂停
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: '按回车键继续...',
        }]);

      } catch (error) {
        const err = error as { isTtyError?: boolean; message?: string };
        if (err.isTtyError || (err.message && err.message.includes('User force closed'))) {
          console.log(chalk.blue('\n👋 再见！'));
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
        message: '选择模板类型:',
        choices: [
          { name: '🌐 Git仓库模板', value: 'git' },
          { name: '📁 本地目录模板', value: 'local' },
        ],
      },
    ]);

    const commonQuestions = [
      {
        type: 'input',
        name: 'name',
        message: '模板名称:',
        validate: (input: string) => input.trim() !== '' || '模板名称不能为空',
      },
      {
        type: 'input',
        name: 'description',
        message: '模板描述 (可选):',
      },
    ];

    let sourceQuestion;
    if (templateType === 'git') {
      sourceQuestion = {
        type: 'input',
        name: 'source',
        message: 'Git仓库URL:',
        validate: (input: string) => {
          if (!input.trim()) return 'Git URL不能为空';
          if (!/^(https?:\/\/)|(git@)|(ssh:\/\/)/.test(input)) {
            return '请输入有效的Git URL';
          }
          return true;
        },
      };
    } else {
      sourceQuestion = {
        type: 'input',
        name: 'source',
        message: '本地目录路径:',
        validate: (input: string) => {
          if (!input.trim()) return '本地路径不能为空';
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(input.trim());
          if (!fs.existsSync(fullPath)) return '指定的目录不存在';
          if (!fs.statSync(fullPath).isDirectory()) return '指定的路径不是目录';
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
      logger.error('没有可用的模板');
      return;
    }

    const choices = [
      { name: '🔄 更新所有模板', value: '__all__' },
      ...templatesResult.templates.map(template => ({
        name: `${template.name} - ${template.description}`,
        value: template.name,
      })),
    ];

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '选择要更新的模板:',
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
      logger.error('没有可用的模板');
      return;
    }

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '选择要删除的模板:',
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
        message: `确定要删除模板 "${templateName}" 吗？`,
        default: false,
      },
    ]);

    if (confirm) {
      const result = this.scaffold.removeTemplate(templateName);
      this.handleResult(result);
    } else {
      logger.info('取消删除操作');
    }
  }

  /**
   * 交互式查看模板信息
   */
  private async interactiveTemplateInfo(): Promise<void> {
    const templatesResult = this.scaffold.listTemplates();
    
    if (!templatesResult.success || !templatesResult.templates || templatesResult.templates.length === 0) {
      logger.error('没有可用的模板');
      return;
    }

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '选择要查看的模板:',
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
    console.log(chalk.blue.bold(`\n📋 模板详情: ${name}\n`));
    console.log(`📝 描述: ${template.description || '无描述'}`);
    console.log(`📅 添加时间: ${new Date(template.addedAt).toLocaleString()}`);
    
    if (template.type === 'git') {
      console.log(`🔗 Git URL: ${template.gitUrl}`);
    } else {
      console.log(`📁 源路径: ${template.sourcePath}`);
      console.log(`🏷️  类型: 本地模板`);
    }
    
    if (template.updatedAt) {
      console.log(`🔄 最后更新: ${new Date(template.updatedAt).toLocaleString()}`);
    }
    
    if (template.config?.tags) {
      console.log(`🏷️  标签: ${template.config.tags.join(', ')}`);
    }
    
    if (template.config?.postCreateInstructions) {
      console.log('\n📝 创建后说明:');
      template.config.postCreateInstructions.forEach((instruction: string) => {
        console.log(`  • ${instruction}`);
      });
    }
    
    console.log(`📁 本地路径: ${template.localPath}`);
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
        logger.success(`配置已导出到: ${filePath}`);
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
   * 运行CLI
   */
  public async run(argv: string[]): Promise<void> {
    await this.program.parseAsync(argv);
  }
}