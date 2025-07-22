// src/types/index.ts - 项目类型定义

export interface TemplateConfig {
  /** 模板基本信息 */
  name: string;
  description: string;
  version: string;
  author?: string;
  
  /** 模板变量定义 */
  variables?: Record<string, string>;
  
  /** 项目创建后执行的命令 */
  postProcess?: string[];
  
  /** 创建完成后显示的说明 */
  postCreateInstructions?: string[];
  
  /** 环境要求 */
  requirements?: {
    node?: string;
    npm?: string;
    [key: string]: string | undefined;
  };
  
  /** 标签分类 */
  tags?: string[];
  
  /** 忽略文件 */
  ignore?: string[];
  
  /** 交互式配置 */
  prompts?: TemplatePrompt[];
}

export interface TemplatePrompt {
  name: string;
  type: 'input' | 'select' | 'confirm' | 'multiselect';
  message: string;
  default?: any;
  choices?: Array<string | { name: string; value: any }>;
}

export interface TemplateInfo {
  gitUrl?: string;
  localPath: string;
  description: string;
  addedAt: string;
  updatedAt?: string;
  config?: TemplateConfig;
  type: 'git' | 'local';
  sourcePath?: string;
}

export interface ScaffoldConfig {
  templates: Record<string, TemplateInfo>;
  lastUpdated: string;
}

export interface OperationResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface CreateProjectOptions {
  templateName: string;
  projectName: string;
  targetDir?: string;
  variables?: Record<string, string>;
}

export interface CreateProjectResult extends OperationResult {
  projectPath?: string;
}

export interface ListTemplatesResult extends OperationResult {
  templates?: Array<{
    name: string;
    description: string;
    gitUrl?: string;
    addedAt: string;
    tags?: string[];
    type: 'git' | 'local';
    sourcePath?: string;
  }>;
}

export interface TemplateVariables {
  PROJECT_NAME: string;
  CURRENT_YEAR: string;
  CREATION_DATE: string;
  [key: string]: string;
}

export interface CLICommand {
  name: string;
  description: string;
  handler: (...args: any[]) => Promise<OperationResult>;
}

// MCP 相关类型
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image';
    text: string;
    data?: string;
    mimeType?: string;
    _meta?: Record<string, unknown>;
  }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
  structuredContent?: Record<string, unknown>;
}

export interface MCPResourceContent {
  uri: string;
  text?: string;
  blob?: string;
  mimeType?: string;
}

export interface MCPResourceResult {
  contents: MCPResourceContent[];
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: 'text' | 'image' | 'audio';
    text: string;
    data?: string;
    mimeType?: string;
    _meta?: Record<string, unknown>;
  };
  _meta?: Record<string, unknown>;
}

export interface MCPPromptResult {
  messages: MCPPromptMessage[];
  description?: string;
  _meta?: Record<string, unknown>;
}