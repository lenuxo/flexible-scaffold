// src/mcp-scaffold-server.ts - MCP 服务器实现

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FlexibleScaffold } from './FlexibleScaffold';
import type { 
  TemplateInfo 
} from './types';
import { logger } from './utils';
import { t } from './i18n';

/**
 * MCP 服务器类
 */
export class ScaffoldMCPServer {
  private server: McpServer;
  private scaffold: FlexibleScaffold;

  constructor() {
    const packageJson = require('../package.json');
    
    this.server = new McpServer({
      name: "flexible-scaffold",
      version: packageJson.version,
      description: t('mcp.server.description')
    });

    this.scaffold = new FlexibleScaffold();
    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  /**
   * 设置MCP工具
   */
  private setupTools(): void {
    // 添加模板工具
    this.server.tool(
      "add_project_template",
      {
        name: z.string().describe(t('mcp.tools.add_project_template.name_desc')),
        source: z.string().describe(t('mcp.tools.add_project_template.source_desc')), 
        description: z.string().optional().describe(t('mcp.tools.add_project_template.description_desc'))
      },
      async ({ name, source, description }) => {
        try {
          const result = await this.scaffold.addTemplate(name, source, description || '');
          
          if (result.success) {
            const isGitUrl = source.startsWith('http') || source.startsWith('git@') || source.startsWith('ssh://');
            const typeText = isGitUrl ? 'Git' : t('common.local');
            const sourceText = isGitUrl ? `Git URL: ${source}` : `${t('common.source')} ${t('common.path')}: ${source}`;
            
            return {
              content: [{
                type: "text",
                text: t('mcp.messages.template_added', { type: typeText, name })
              }]
            };
          } else {
            return {
              content: [{
                type: "text",
                text: t('mcp.messages.template_add_failed', { error: result.error || '' })
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.template_add_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 删除模板工具  
    this.server.tool(
      "remove_project_template",
      {
        name: z.string().describe(t('mcp.tools.remove_project_template.name_desc'))
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.removeTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? t('mcp.messages.template_removed', { name })
                : t('mcp.messages.template_remove_failed', { error: result.error || '' })
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.template_remove_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 更新模板工具
    this.server.tool(
      "update_project_template",
      {
        name: z.string().describe(t('mcp.tools.update_project_template.name_desc'))
      },
      async ({ name }) => {
        try {
          const result = await this.scaffold.updateTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? t('mcp.messages.template_updated', { name })
                : t('mcp.messages.template_update_failed', { error: result.error || '' })
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.template_update_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 批量更新所有模板工具
    this.server.tool(
      "update_all_templates",
      {},
      async () => {
        try {
          const result = await this.scaffold.updateAllTemplates();
          return {
            content: [{
              type: "text",
              text: result.success 
                ? t('mcp.messages.all_templates_updated') + ': ' + (result.message || '')
                : t('mcp.messages.templates_update_failed', { error: result.error || '' })
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.templates_update_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 列出模板工具
    this.server.tool(
      "list_project_templates",
      {},
      async () => {
        try {
          const result = this.scaffold.listTemplates();
          
          if (!result.templates || result.templates.length === 0) {
            return {
              content: [{
                type: "text",
                text: t('mcp.messages.no_templates') + "\n\n" + t('mcp.tools.add_project_template.description')
              }]
            };
          }

          let output = t('mcp.messages.available_templates') + ":\n\n";
          result.templates.forEach((template, index) => {
            const typeIcon = template.type === 'local' ? '📁' : '🌐';
            const typeText = template.type === 'local' ? t('common.local') : 'Git';
            
            output += `${index + 1}. **${template.name}** ${typeIcon}[${typeText}]\n`;
            output += `   📝 ${t('common.description')}: ${template.description}\n`;
            
            if (template.type === 'git') {
              output += `   🔗 Git ${t('common.url')}: ${template.gitUrl}\n`;
            } else {
              output += `   📁 ${t('common.source')} ${t('common.path')}: ${template.sourcePath}\n`;
            }
            
            output += `   📅 ${t('common.date')}: ${new Date(template.addedAt).toLocaleString()}\n`;
            if (template.tags) {
              output += `   🏷️ ${t('common.tags')}: ${template.tags.join(', ')}\n`;
            }
            output += '\n';
          });

          return {
            content: [{
              type: "text",
              text: output
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.templates_update_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 创建项目工具
    this.server.tool(
      "initialize_project",
      {
        templateName: z.string().describe(t('mcp.tools.initialize_project.template_name_desc')),
        projectName: z.string().describe(t('mcp.tools.initialize_project.project_name_desc')),
        targetDir: z.string().optional().describe(t('mcp.tools.initialize_project.target_dir_desc')),
        variables: z.record(z.string()).optional().describe(t('mcp.tools.initialize_project.variables_desc'))
      },
      async ({ templateName, projectName, targetDir, variables }) => {
        try {
          const result = await this.scaffold.createProject({
            templateName,
            projectName,
            targetDir: targetDir || '.',
            variables
          });
          
          if (result.success) {
            let output = `🚀 ${t('mcp.messages.project_created', { name: projectName })}\n`;
            output += `📁 ${t('common.project')} ${t('common.path')}: ${result.projectPath}\n`;
            output += `📦 ${t('common.template')}: ${templateName}\n\n`;
            output += `📝 ${t('common.next')} ${t('common.steps')}:\n`;
            output += `  cd ${projectName}\n`;
            output += `  npm install\n`;
            output += `  npm run dev\n`;
            
            return {
              content: [{
                type: "text",
                text: output
              }]
            };
          } else {
            return {
              content: [{
                type: "text",
                text: t('mcp.messages.project_create_failed', { error: result.error || '' })
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.project_create_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 获取模板详情工具
    this.server.tool(
      "get_template_info",
      {
        name: z.string().describe(t('mcp.tools.get_template_info.name_desc'))
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.getTemplateInfo(name);
          
          if (!result.success || !result.data) {
            return {
              content: [{
                type: "text",
                text: t('mcp.messages.template_not_found', { name }) + "\n\n" + t('mcp.tools.list_project_templates.description')
              }]
            };
          }
          
          const template = result.data as TemplateInfo;
          let output = `📋 ${t('mcp.messages.template_info', { name })}\n\n`;
          output += `📝 ${t('common.description')}: ${template.description || t('common.optional')}\n`;
          output += `📅 ${t('common.date')}: ${new Date(template.addedAt).toLocaleString()}\n`;
          
          if (template.type === 'git') {
            output += `🔗 Git ${t('common.url')}: ${template.gitUrl}\n`;
          } else {
            output += `📁 ${t('common.source')} ${t('common.path')}: ${template.sourcePath}\n`;
            output += `🏷️  ${t('common.type')}: ${t('common.local')} ${t('common.template')}\n`;
          }
          
          if (template.updatedAt) {
            output += `🔄 ${t('common.last')} ${t('common.update')}: ${new Date(template.updatedAt).toLocaleString()}\n`;
          }
          
          if (template.config?.tags) {
            output += `🏷️ ${t('common.tags')}: ${template.config.tags.join(', ')}\n`;
          }
          
          if (template.config?.postCreateInstructions) {
            output += `\n📝 ${t('common.create')} ${t('common.after')} ${t('common.instructions')}:\n`;
            template.config.postCreateInstructions.forEach(instruction => {
              output += `  • ${instruction}\n`;
            });
          }

          if (template.config?.requirements) {
            output += `\n⚙️ ${t('common.environment')} ${t('common.requirements')}:\n`;
            Object.entries(template.config.requirements).forEach(([key, value]) => {
              if (value) {
                output += `  • ${key}: ${value}\n`;
              }
            });
          }

          return {
            content: [{
              type: "text",
              text: output
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.template_info') + t('common.error') + `: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 验证模板工具
    this.server.tool(
      "validate_template",
      {
        name: z.string().describe(t('mcp.tools.validate_template.name_desc'))
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.validateTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? t('mcp.messages.template_valid', { name })
                : t('mcp.messages.template_invalid', { error: result.error || '' })
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.template_invalid', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );

    // 清理无效模板工具
    this.server.tool(
      "cleanup_invalid_templates",
      {},
      async () => {
        try {
          const result = this.scaffold.cleanupInvalidTemplates();
          return {
            content: [{
              type: "text",
              text: result.success 
                ? t('mcp.messages.cleanup_complete', { message: result.message || '' })
                : t('mcp.messages.cleanup_failed', { error: result.error || '' })
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: t('mcp.messages.cleanup_failed', { error: error instanceof Error ? error.message : String(error) })
            }]
          };
        }
      }
    );
  }

  /**
   * 设置MCP资源
   */
  private setupResources(): void {
    // 配置信息资源
    this.server.resource(
      "scaffold-config",
      "scaffold://config",
      async (uri) => {
        try {
          const config = this.scaffold.loadConfig();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({
                configPath: this.scaffold.getConfigDir(),
                templatesPath: this.scaffold.getTemplatesDir(),
                templateCount: Object.keys(config.templates).length,
                templates: Object.keys(config.templates),
                lastUpdated: config.lastUpdated
              }, null, 2),
              mimeType: "application/json"
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error loading config: ${error instanceof Error ? error.message : String(error)}`,
              mimeType: "text/plain"
            }]
          };
        }
      }
    );

    // 模板统计资源
    this.server.resource(
      "scaffold-stats",
      "scaffold://stats",
      async (uri) => {
        try {
          const config = this.scaffold.loadConfig();
          const templates = Object.values(config.templates);
          
          const stats = {
            totalTemplates: templates.length,
            templatesByTags: {} as Record<string, number>,
            recentlyAdded: templates
              .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
              .slice(0, 5)
              .map(t => ({ name: Object.keys(config.templates).find(key => config.templates[key] === t), addedAt: t.addedAt })),
            recentlyUpdated: templates
              .filter(t => t.updatedAt)
              .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
              .slice(0, 5)
              .map(t => ({ name: Object.keys(config.templates).find(key => config.templates[key] === t), updatedAt: t.updatedAt }))
          };

          // 统计标签
          templates.forEach(template => {
            if (template.config?.tags) {
              template.config.tags.forEach(tag => {
                stats.templatesByTags[tag] = (stats.templatesByTags[tag] || 0) + 1;
              });
            }
          });

          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(stats, null, 2),
              mimeType: "application/json"
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error generating stats: ${error instanceof Error ? error.message : String(error)}`,
              mimeType: "text/plain"
            }]
          };
        }
      }
    );
  }

  /**
   * 设置MCP提示
   */
  private setupPrompts(): void {
    // 使用帮助提示
    this.server.prompt("scaffold-usage-help", 
      t('mcp.prompts.usage_help'),
      {
        action: z.enum(["setup", "create", "manage", "general"]).optional().describe(t('common.action'))
      },
      ({ action }) => {
        let promptText = "";
        
        switch (action) {
          case "setup":
            promptText = `I want to setup scaffold tool, need to add some project templates. Please help me:
1. Add a React + Ant Design template
2. Add a Next.js + Tailwind CSS template
3. List all available templates

These templates' Git repository URLs I will provide.`;
            break;
            
          case "create":
            promptText = `I want to use scaffold to create a new project. Please help me:
1. First view available templates
2. Based on my requirements recommend suitable templates
3. Create project and provide next steps guidance

My project requirements are: [Please describe your project type and tech stack requirements]`;
            break;
            
          case "manage":
            promptText = `I need to manage existing scaffold templates. Please help me:
1. View all current templates status
2. Update outdated templates
3. Remove no longer needed templates
4. Add new templates

Please first show current templates list.`;
            break;
            
          default:
            promptText = `I want to use project scaffold tool to quickly initialize projects or manage project templates. This tool specializes in:

🚀 **Project initialization** (when you need to create new projects):
- Quickly create React, Vue, Next.js, Node.js etc. projects
- One-click generate complete project structure and config
- Automatic install dependencies and initialize Git

📦 **Template management** (when you need to manage project templates):
- Add GitHub/GitLab projects as templates
- Update templates to latest version
- View and validate available templates
- Cleanup invalid templates

💡 **Usage scenarios**:
- "Help me create a React project"
- "Add a GitHub Next.js template"
- "View which available project templates"
- "Update all outdated templates"

Please tell me your specific requirements, like "create a React project" or "add a template".`;
        }

        return {
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: promptText
            }
          }]
        };
      }
    );

    // 项目创建指导提示
    this.server.prompt("create-new-project", 
      "Create new project guidance prompt, recommend appropriate templates based on requirements",
      {
        projectType: z.string().describe("Project type or tech stack, such as React, Vue, Next.js, Node.js API"),
        features: z.string().optional().describe("Required features or functionality, such as TypeScript, Tailwind, database integration")
      },
      ({ projectType, features }) => {
        const promptText = `I want to create a ${projectType} project${features ? `, need to include the following features: ${features}` : ''}.

Please help me:
1. Use list_project_templates to view available project templates
2. Based on my requirements recommend most suitable templates
3. Use initialize_project to create project
4. Provide project after creation configuration suggestions

Example:
- If see suitable templates: "use template 'react-vite' create project"
- If no suitable templates: "I can help you add a new template"`;

        return {
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: promptText
            }
          }]
        };
      }
    );

    // 模板开发指导提示
    this.server.prompt("add-custom-template", 
      "Create custom project template guidance prompt",
      {
        templateName: z.string().describe("Template name, such as 'my-react-template'"),
        baseFramework: z.string().describe("Base framework or tech stack, such as React, Vue, Express"),
        features: z.string().optional().describe("Features to include, such as TypeScript, Tailwind, authentication system")
      },
      ({ templateName, baseFramework, features }) => {
        const promptText = `I want to create a new project template "${templateName}", based on ${baseFramework}${features ? `, including the following features: ${features}` : ''}.

Please guide me:
1. How to structure template directory
2. How to write scaffold.config.js config file
3. How to use template variables (like {{PROJECT_NAME}})
4. How to set post-processing scripts
5. Best practices and notes

After completion please use add_project_template to add template to scaffold tool.`;

        return {
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: promptText
            }
          }]
        };
      }
    );
  }

  /**
   * 启动MCP服务器
   */
  public async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      
      logger.info(t('mcp.server.starting'));
      await this.server.connect(transport);
      logger.success(t('mcp.server.connected'));
      
    } catch (error) {
      logger.error(t('mcp.server.failed') + `: ${error}`);
      throw error;
    }
  }

  /**
   * 获取服务器实例
   */
  public getServer(): McpServer {
    return this.server;
  }

  /**
   * 获取脚手架实例
   */
  public getScaffold(): FlexibleScaffold {
    return this.scaffold;
  }
}

/**
 * 创建并启动MCP服务器
 */
export async function createScaffoldMCPServer(): Promise<ScaffoldMCPServer> {
  const mcpServer = new ScaffoldMCPServer();
  await mcpServer.start();
  return mcpServer;
}

// 如果直接运行此脚本
if (require.main === module) {
  createScaffoldMCPServer().catch(error => {
    logger.error(`Failed to start MCP server: ${error}`);
    process.exit(1);
  });
}