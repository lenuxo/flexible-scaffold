// src/mcp-scaffold-server.ts - MCP 服务器实现

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FlexibleScaffold } from './FlexibleScaffold';
import type { 
  TemplateInfo 
} from './types';
import { logger } from './utils';

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
      description: "灵活的项目脚手架工具，支持Git管理的模板"
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
      "add_scaffold_template",
      {
        name: z.string().describe("模板名称（唯一标识符）"),
        gitUrl: z.string().describe("Git仓库URL"), 
        description: z.string().optional().describe("模板描述（可选）")
      },
      async ({ name, gitUrl, description }) => {
        try {
          const result = await this.scaffold.addTemplate(name, gitUrl, description || '');
          return {
            content: [{
              type: "text",
              text: result.success 
                ? `✅ 成功添加模板 "${name}"\n📍 Git URL: ${gitUrl}\n📝 描述: ${description || '无描述'}`
                : `❌ 添加模板失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 添加模板时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 删除模板工具  
    this.server.tool(
      "remove_scaffold_template",
      {
        name: z.string().describe("要删除的模板名称")
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.removeTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? `✅ 成功删除模板 "${name}"`
                : `❌ 删除模板失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 删除模板时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 更新模板工具
    this.server.tool(
      "update_scaffold_template",
      {
        name: z.string().describe("要更新的模板名称")
      },
      async ({ name }) => {
        try {
          const result = await this.scaffold.updateTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? `✅ 成功更新模板 "${name}" 到最新版本`
                : `❌ 更新模板失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 更新模板时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 批量更新所有模板工具
    this.server.tool(
      "update_all_scaffold_templates",
      {},
      async () => {
        try {
          const result = await this.scaffold.updateAllTemplates();
          return {
            content: [{
              type: "text",
              text: result.success 
                ? `✅ ${result.message}`
                : `❌ 批量更新失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 批量更新时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 列出模板工具
    this.server.tool(
      "list_scaffold_templates",
      {},
      async () => {
        try {
          const result = this.scaffold.listTemplates();
          
          if (!result.templates || result.templates.length === 0) {
            return {
              content: [{
                type: "text",
                text: "📭 暂无可用模板\n\n使用 add_scaffold_template 工具添加新模板。"
              }]
            };
          }

          let output = "📋 可用模板列表:\n\n";
          result.templates.forEach((template, index) => {
            output += `${index + 1}. **${template.name}**\n`;
            output += `   📝 描述: ${template.description}\n`;
            output += `   🔗 Git URL: ${template.gitUrl}\n`;
            output += `   📅 添加时间: ${new Date(template.addedAt).toLocaleString()}\n`;
            if (template.tags) {
              output += `   🏷️ 标签: ${template.tags.join(', ')}\n`;
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
              text: `❌ 获取模板列表时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 创建项目工具
    this.server.tool(
      "create_project_from_scaffold",
      {
        templateName: z.string().describe("使用的模板名称"),
        projectName: z.string().describe("新项目的名称"),
        targetDir: z.string().optional().describe("目标目录路径（可选，默认为当前目录）"),
        variables: z.record(z.string()).optional().describe("自定义模板变量（可选）")
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
            let output = `🚀 项目 "${projectName}" 创建成功!\n`;
            output += `📁 项目路径: ${result.projectPath}\n`;
            output += `📦 使用模板: ${templateName}\n\n`;
            output += `📝 下一步操作:\n`;
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
                text: `❌ 创建项目失败: ${result.error}`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 创建项目时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 获取模板详情工具
    this.server.tool(
      "get_scaffold_template_info",
      {
        name: z.string().describe("模板名称")
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.getTemplateInfo(name);
          
          if (!result.success || !result.data) {
            return {
              content: [{
                type: "text",
                text: `❌ 模板 "${name}" 不存在\n\n使用 list_scaffold_templates 查看可用模板。`
              }]
            };
          }
          
          const template = result.data as TemplateInfo;
          let output = `📋 模板详情: **${name}**\n\n`;
          output += `📝 描述: ${template.description || '无描述'}\n`;
          output += `🔗 Git URL: ${template.gitUrl}\n`;
          output += `📅 添加时间: ${new Date(template.addedAt).toLocaleString()}\n`;
          
          if (template.updatedAt) {
            output += `🔄 最后更新: ${new Date(template.updatedAt).toLocaleString()}\n`;
          }
          
          if (template.config?.tags) {
            output += `🏷️ 标签: ${template.config.tags.join(', ')}\n`;
          }
          
          if (template.config?.postCreateInstructions) {
            output += `\n📝 创建后说明:\n`;
            template.config.postCreateInstructions.forEach(instruction => {
              output += `  • ${instruction}\n`;
            });
          }

          if (template.config?.requirements) {
            output += `\n⚙️ 环境要求:\n`;
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
              text: `❌ 获取模板信息时发生错误: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    );

    // 验证模板工具
    this.server.tool(
      "validate_scaffold_template",
      {
        name: z.string().describe("要验证的模板名称")
      },
      async ({ name }) => {
        try {
          const result = this.scaffold.validateTemplate(name);
          return {
            content: [{
              type: "text",
              text: result.success 
                ? `✅ 模板 "${name}" 验证通过，可以正常使用`
                : `❌ 模板验证失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 验证模板时发生错误: ${error instanceof Error ? error.message : String(error)}`
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
                ? `✅ ${result.message}`
                : `❌ 清理失败: ${result.error}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `❌ 清理时发生错误: ${error instanceof Error ? error.message : String(error)}`
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
    this.server.prompt("scaffold-usage-help", {
      action: z.enum(["setup", "create", "manage", "general"]).optional().describe("需要帮助的操作类型")
    }, ({ action }) => {
      let promptText = "";
      
      switch (action) {
        case "setup":
          promptText = `我想设置脚手架工具，需要添加一些项目模板。请帮我：
1. 添加一个 React + Ant Design 的模板
2. 添加一个 Next.js + Tailwind CSS 的模板
3. 列出当前所有可用的模板

这些模板的 Git 仓库地址我会提供给你。`;
          break;
          
        case "create":
          promptText = `我想使用脚手架创建一个新项目。请帮我：
1. 先查看有哪些可用的模板
2. 根据我的需求推荐合适的模板
3. 创建项目并提供后续步骤指导

我的项目需求是：[请描述你的项目类型和技术栈要求]`;
          break;
          
        case "manage":
          promptText = `我需要管理现有的脚手架模板。请帮我：
1. 查看当前所有模板的状态
2. 更新过时的模板
3. 删除不再需要的模板
4. 添加新的模板

请先显示当前的模板列表。`;
          break;
          
        default:
          promptText = `我想使用灵活的脚手架工具。这个工具可以：

📦 **模板管理**：
- 添加 Git 仓库作为项目模板
- 删除不需要的模板
- 更新模板到最新版本
- 查看所有可用模板

🚀 **项目创建**：
- 基于模板快速创建新项目
- 自动替换模板变量
- 执行后处理脚本
- 提供创建后指导

🔧 **高级功能**：
- 验证模板有效性
- 清理无效模板
- 批量更新模板
- 查看使用统计

请告诉我你想要做什么，我来帮你完成。`;
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
    });

    // 项目创建指导提示
    this.server.prompt("project-creation-guide", {
      projectType: z.string().describe("项目类型或技术栈"),
      features: z.string().optional().describe("需要的特性或功能")
    }, ({ projectType, features }) => {
      const promptText = `我想创建一个 ${projectType} 项目${features ? `，需要包含以下特性：${features}` : ''}。

请帮我：
1. 查看是否有合适的脚手架模板
2. 如果有多个选择，请推荐最适合的
3. 指导我创建项目
4. 提供项目创建后的配置建议

如果没有合适的现有模板，请建议我如何添加新的模板。`;

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: promptText
          }
        }]
      };
    });

    // 模板开发指导提示
    this.server.prompt("template-development-guide", {
      templateName: z.string().describe("模板名称"),
      baseFramework: z.string().describe("基础框架或技术栈"),
      features: z.string().optional().describe("要包含的特性")
    }, ({ templateName, baseFramework, features }) => {
      const promptText = `我想创建一个新的脚手架模板 "${templateName}"，基于 ${baseFramework}${features ? `，包含以下特性：${features}` : ''}。

请指导我：
1. 如何结构化模板目录
2. 如何编写 scaffold.config.js 配置文件
3. 如何使用模板变量（如 {{PROJECT_NAME}}）
4. 如何设置后处理脚本
5. 最佳实践和注意事项

完成后我需要将模板推送到 Git 仓库并添加到脚手架工具中。`;

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: promptText
          }
        }]
      };
    });
  }

  /**
   * 启动MCP服务器
   */
  public async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      
      logger.info('🚀 Flexible Scaffold MCP Server starting...');
      await this.server.connect(transport);
      logger.success('✅ MCP Server connected successfully');
      
    } catch (error) {
      logger.error(`❌ Failed to start MCP server: ${error}`);
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