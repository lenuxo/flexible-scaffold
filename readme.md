# 灵活脚手架工具 (TypeScript)

<div align="center">
  <h3>🚀 灵活的项目脚手架工具</h3>
  <p>支持Git管理的模板和AI助手调用的TypeScript项目</p>
  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
    <img alt="Git" src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" />
  </p>
</div>

## ✨ 核心特性

- 🎯 **TypeScript 支持**: 完整的类型定义和类型安全
- 🔄 **Git解耦管理**: 脚手架模板通过Git仓库独立管理
- 🛠️ **灵活添加删除**: 支持动态添加、删除、更新脚手架模板
- 🤖 **AI友好**: 支持MCP协议和JSON输出，便于AI助手调用
- ⚡ **单命令操作**: 所有操作都支持单条命令完成
- 🎨 **模板变量**: 支持模板变量替换和后处理脚本
- 📱 **交互式界面**: 提供友好的交互式命令界面
- 🧪 **完整测试**: 包含MCP服务器功能测试

## 📦 快速开始

### 安装依赖

```bash
git clone <repository-url>
cd flexible-scaffold
npm install
```

### 构建项目

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动构建后的版本
npm start
```

### 全局安装

```bash
# 方法1: 使用npm link
npm run build
npm link

# 方法2: 全局安装构建后的包
npm run build
npm install -g .
```

## 🎯 使用方法

### 基本命令

```bash
# 查看帮助
scaffold --help

# 添加脚手架模板
scaffold add react-antd https://github.com/username/react-antd-template.git "React + Ant Design模板"

# 列出所有模板
scaffold list

# 创建项目
scaffold create react-antd my-new-project

# 交互式创建
scaffold create react-antd my-project --interactive

# 更新特定模板
scaffold update react-antd

# 批量更新所有模板
scaffold update

# 删除模板
scaffold remove react-antd

# 查看模板信息
scaffold info react-antd

# 验证模板
scaffold validate react-antd

# 清理无效模板
scaffold cleanup

# 启动交互式界面
scaffold interactive
```

### 配置管理

```bash
# 显示配置
scaffold config --show

# 显示配置路径
scaffold config --path

# 导出配置
scaffold config --export config-backup.json

# 导入配置
scaffold config --import config-backup.json
```

### AI助手调用

```bash
# 使用JSON输出模式（适合AI调用）
SCAFFOLD_JSON_OUTPUT=true scaffold list

# 或使用专用包装脚本
./scripts/scaffold-ai.sh list
./scripts/scaffold-ai.sh create react-antd my-project
```

## 🏗️ 项目结构

```
flexible-scaffold/
├── src/                          # TypeScript 源代码
│   ├── types/                    # 类型定义
│   │   └── index.ts
│   ├── utils/                    # 工具函数
│   │   └── index.ts
│   ├── FlexibleScaffold.ts       # 核心功能类
│   ├── cli.ts                    # 命令行接口
│   ├── mcp-scaffold-server.ts    # MCP服务器
│   ├── test-mcp.ts              # MCP测试脚本
│   └── index.ts                 # 入口文件
├── scripts/                     # 脚本文件
│   └── scaffold-ai.sh           # AI友好包装脚本
├── dist/                        # 构建输出目录
├── package.json                 # 项目配置
├── tsconfig.json               # TypeScript配置
├── .eslintrc.json              # ESLint配置
└── README.md                   # 项目文档
```

## 🎨 创建脚手架模板

### 模板仓库结构

```
my-template/
├── scaffold.config.js           # 模板配置文件
├── package.json                # 项目package.json模板
├── src/                        # 源代码模板
│   ├── App.tsx
│   └── index.tsx
├── public/
│   └── index.html
└── README.md                   # 项目说明模板
```

### 配置文件示例 (scaffold.config.js)

```javascript
module.exports = {
  name: "React + TypeScript Template",
  description: "React项目配置TypeScript和现代开发工具",
  version: "1.0.0",
  author: "Your Name",
  
  // 后处理命令
  postProcess: [
    "npm install",
    "git init",
    "git add .",
    "git commit -m 'Initial commit from scaffold'"
  ],
  
  // 用户说明
  postCreateInstructions: [
    "cd {{PROJECT_NAME}}",
    "npm run dev",
    "在浏览器中打开 http://localhost:3000"
  ],
  
  // 环境要求
  requirements: {
    node: ">=16.0.0",
    npm: ">=8.0.0"
  },
  
  // 模板标签
  tags: ["react", "typescript", "frontend", "modern"]
};
```

### 模板变量使用

在模板文件中使用 `{{变量名}}` 语法：

**package.json**:
```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "Created on {{CREATION_DATE}}",
  "author": "{{AUTHOR_NAME}}"
}
```

**src/App.tsx**:
```tsx
import React from 'react';

const App: React.FC = () => {
  return (
    <div>
      <h1>Welcome to {{PROJECT_NAME}}</h1>
      <p>Created on {{CREATION_DATE}}</p>
    </div>
  );
};

export default App;
```

## 🤖 MCP 集成

### 启动MCP服务器

```bash
# 开发模式
npm run mcp

# 或直接运行
npx tsx src/mcp-scaffold-server.ts
```

### Claude Desktop配置

在 `~/.config/claude-desktop/claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "flexible-scaffold": {
      "command": "node",
      "args": ["path/to/flexible-scaffold/dist/mcp-scaffold-server.js"]
    }
  }
}
```

### 可用的MCP功能

**🔧 工具 (Tools)**:
- `add_scaffold_template`: 添加新模板
- `remove_scaffold_template`: 删除模板
- `update_scaffold_template`: 更新特定模板
- `update_all_scaffold_templates`: 批量更新所有模板
- `list_scaffold_templates`: 列出所有模板
- `create_project_from_scaffold`: 创建项目
- `get_scaffold_template_info`: 获取模板详情
- `validate_scaffold_template`: 验证模板
- `cleanup_invalid_templates`: 清理无效模板

**📄 资源 (Resources)**:
- `scaffold://config`: 查看脚手架配置信息
- `scaffold://stats`: 查看使用统计信息

**💬 提示 (Prompts)**:
- `scaffold-usage-help`: 获取使用帮助
- `project-creation-guide`: 项目创建指导
- `template-development-guide`: 模板开发指导

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行MCP服务器测试
npm run test:mcp

# 运行特定MCP测试
npm run test:mcp tools
npm run test:mcp call
npm run test:mcp resources
npm run test:mcp prompts
```

### 代码质量

```bash
# TypeScript类型检查
npx tsc --noEmit

# ESLint检查
npm run lint

# 修复ESLint问题
npm run lint:fix
```

## 📝 开发指南

### 添加新功能

1. **添加类型定义**: 在 `src/types/index.ts` 中定义相关类型
2. **实现功能**: 在 `FlexibleScaffold.ts` 中添加核心功能
3. **更新CLI**: 在 `cli.ts` 中添加命令行接口
4. **更新MCP**: 在 `mcp-scaffold-server.ts` 中添加MCP工具/资源/提示
5. **添加测试**: 编写相应的测试用例
6. **更新文档**: 更新README和类型文档

### TypeScript开发注意事项

- 使用严格的TypeScript配置
- 为所有公共API提供完整的类型定义
- 使用泛型提高代码复用性
- 避免使用 `any` 类型，使用 `unknown` 代替
- 使用接口定义数据结构
- 为异步操作提供正确的返回类型

### 构建和发布

```bash
# 清理构建目录
npm run clean

# 构建项目
npm run build

# 准备发布
npm run prepare

# 发布到npm
npm publish
```

## 🔧 配置项

### 环境变量

- `SCAFFOLD_JSON_OUTPUT`: 设置为 `true` 启用JSON输出模式
- `DEBUG`: 设置为 `true` 启用调试日志
- `SCAFFOLD_CONFIG_DIR`: 自定义配置目录路径

### 配置文件位置

- **默认配置目录**: `~/.flexible-scaffold/`
- **模板存储目录**: `~/.flexible-scaffold/templates/`
- **配置文件**: `~/.flexible-scaffold/templates.json`

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置

```bash
git clone <your-fork>
cd flexible-scaffold
npm install
npm run build
npm run test
```

---

<div align="center">
  <p>如果这个项目对你有帮助，请给个 ⭐️ Star！</p>
</div>