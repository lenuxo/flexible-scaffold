# 灵活脚手架工具 (TypeScript)

<div align="center">
  <h3>🚀 灵活的项目脚手架工具</h3>
  <p>支持Git管理的模板和AI助手调用的TypeScript项目</p>
  
  <p>
    <a href="https://www.npmjs.com/package/flexible-scaffold">
      <img alt="npm version" src="https://img.shields.io/npm/v/flexible-scaffold.svg?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/flexible-scaffold">
      <img alt="npm downloads" src="https://img.shields.io/npm/dm/flexible-scaffold.svg?style=flat-square">
    </a>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
    <img alt="Git" src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" />
  </p>
  
  <p>
    <a href="https://www.npmjs.com/package/flexible-scaffold">
      <strong>📦 NPM包: flexible-scaffold</strong>
    </a>
  </p>
</div>

## 📦 NPM包信息

| 信息 | 详情 |
|---|---|
| **包名** | `flexible-scaffold` |
| **版本** | 1.0.3 |
| **NPM地址** | [https://www.npmjs.com/package/flexible-scaffold](https://www.npmjs.com/package/flexible-scaffold) |
| **安装命令** | `npm install -g flexible-scaffold` |
| **Npx使用** | `npx flexible-scaffold [command]` |

## ✨ 核心特性

- 🎯 **TypeScript 支持**: 完整的类型定义和类型安全
- 🔄 **双重模板支持**: 支持Git仓库和本地目录作为模板
- 🛠️ **灵活添加删除**: 支持动态添加、删除、更新Git仓库或本地目录的脚手架模板
- 🤖 **AI友好**: 支持MCP协议和JSON输出，便于AI助手调用
- ⚡ **单命令操作**: 所有操作都支持单条命令完成
- 🎨 **模板变量**: 支持模板变量替换和后处理脚本
- 📱 **交互式界面**: 提供友好的交互式命令界面
- 🧪 **完整测试**: 包含MCP服务器功能测试

## 🚀 快速开始

### 通过NPM安装（推荐）

```bash
# 全局安装
npm install -g flexible-scaffold

# 作为项目依赖安装
npm install flexible-scaffold

# 使用npx直接运行（无需安装）
npx flexible-scaffold --help
```

**📋 NPM包详情**:
- 📦 **包名**: `flexible-scaffold`
- 🏷️ **版本**: 最新稳定版
- 🔗 **仓库**: [GitHub](https://github.com/lenuxo/flexible-scaffold)
- 📖 **文档**: 本README文件
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/lenuxo/flexible-scaffold/issues)

### 从源码安装

```bash
git clone <repository-url>
cd flexible-scaffold
npm install
npm run build
npm install -g .
```

### 构建项目（开发者）

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动构建后的版本
npm start
```

### 全局安装（开发者）

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
flexible-scaffold --help

# 添加Git模板
flexible-scaffold add react-antd https://github.com/username/react-antd-template.git "React + Ant Design模板"

# 添加本地目录模板
flexible-scaffold add my-template /path/to/local/template -d "我的本地模板"

# 列出所有模板
flexible-scaffold list
# 或
flexible-scaffold ls

# 创建项目
flexible-scaffold create react-antd my-new-project

# 交互式创建
flexible-scaffold create react-antd my-project --interactive

# 更新特定模板（仅Git模板）
flexible-scaffold update react-antd

# 批量更新所有模板（仅Git模板）
flexible-scaffold update

# 删除模板
flexible-scaffold remove react-antd
# 或
flexible-scaffold rm react-antd

# 查看模板信息
flexible-scaffold info react-antd

# 验证模板
flexible-scaffold validate react-antd

# 清理无效模板
flexible-scaffold cleanup

# 启动交互式界面
flexible-scaffold interactive
# 或
flexible-scaffold i
```

### 配置管理

```bash
# 显示配置
flexible-scaffold config --show

# 显示配置路径
flexible-scaffold config --path

# 导出配置
flexible-scaffold config --export config-backup.json

# 导入配置
flexible-scaffold config --import config-backup.json
```

### AI助手调用

```bash
# 使用JSON输出模式（适合AI调用）
SCAFFOLD_JSON_OUTPUT=true flexible-scaffold list

# 使用已安装的包
npx flexible-scaffold --json list

# 或使用全局安装的版本
flexible-scaffold --json create react-antd my-project
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
# 使用已安装的包
npx flexible-scaffold mcp

# 或使用全局安装的版本
flexible-scaffold mcp

# 开发模式（从源码）
npm run mcp
```

### NPM包MCP配置

在配置文件（如Claude Desktop的`~/.config/claude-desktop/claude_desktop_config.json`）中添加：

```json
{
  "mcpServers": {
    "flexible-scaffold": {
      "command": "npx",
      "args": ["flexible-scaffold", "mcp"]
    }
  }
}
```

### 全局安装MCP配置

```json
{
  "mcpServers": {
    "flexible-scaffold": {
      "command": "flexible-scaffold",
      "args": ["mcp"]
    }
  }
}
```

### 配置示例（使用全局安装）

```json
{
  "mcpServers": {
    "flexible-scaffold": {
      "command": "flexible-scaffold",
      "args": ["mcp"]
    }
  }
}
```

### 可用的MCP功能

**🔧 工具 (Tools)**:
- `add_scaffold_template`: 添加新模板（Git或本地）
- `remove_scaffold_template`: 删除模板
- `update_scaffold_template`: 更新特定模板（仅Git模板）
- `update_all_scaffold_templates`: 批量更新所有模板（仅Git模板）
- `list_scaffold_templates`: 列出所有模板（Git和本地）
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
```

### 从NPM安装使用

```bash
# 检查包信息
npm view flexible-scaffold

# 安装最新版本
npm install -g flexible-scaffold

# 安装特定版本
npm install -g flexible-scaffold@latest

# 查看已安装的版本
flexible-scaffold --version
```

### 常见问题

**Q: 如何确认安装成功？**
```bash
flexible-scaffold --version
# 应该显示版本号
```

**Q: 如何更新到最新版本？**
```bash
npm update -g flexible-scaffold
```

**Q: 如何卸载？**
```bash
npm uninstall -g flexible-scaffold
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

## 🏷️ 版本历史

- **v1.0.3** - 国际化支持和MCP指令优化 🌍
  - 增加中英文双语支持 🇨🇳🇺🇸
  - 优化MCP指令响应格式
  - 改进错误处理和用户提示
  - 增强CLI输出的国际化体验

- **v1.0.2** - 本地模板支持
  - 支持本地目录模板 📁
  - 双重模板类型识别（Git 🌐 vs 本地 📁）
  - 更新CLI和MCP工具支持本地模板
  - 增强交互式界面支持模板类型选择

- **v1.0.1** - 错误修复和改进
  - 修复MCP命令问题
  - 更新文档

- **v1.0.0** - 初始版本，核心功能
  - 基本脚手架操作
  - Git模板管理
  - MCP服务器支持
  - 交互式CLI
  - TypeScript支持

---

<div align="center">
  <p>如果这个项目对你有帮助，请给个 ⭐️ Star！</p>
</div>