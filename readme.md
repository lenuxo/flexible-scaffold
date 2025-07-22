# Flexible Scaffold CLI (TypeScript)

<div align="center">
  <h3>🚀 Flexible Project Scaffolding Tool</h3>
  <p>TypeScript project supporting Git-managed templates and AI assistant integration</p>
  
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
      <strong>📦 NPM Package: flexible-scaffold</strong>
    </a>
    <br>
    <a href="./README.zh-CN.md">
      <strong>🇨🇳 中文文档 (中文版)</strong>
    </a>
  </p>
</div>

## 📦 NPM Package Information

| Information | Details |
|---|---|
| **Package Name** | `flexible-scaffold` |
| **Version** | 1.0.0 |
| **NPM Registry** | [https://www.npmjs.com/package/flexible-scaffold](https://www.npmjs.com/package/flexible-scaffold) |
| **Install Command** | `npm install -g flexible-scaffold` |
| **Npx Usage** | `npx flexible-scaffold [command]` |

## ✨ Core Features

- 🎯 **TypeScript Support**: Complete type definitions and type safety
- 🔄 **Git Decoupled Management**: Scaffold templates managed independently via Git repositories
- 🛠️ **Flexible Add/Delete**: Dynamic addition, deletion, and updating of scaffold templates
- 🤖 **AI-Friendly**: Supports MCP protocol and JSON output for AI assistant integration
- ⚡ **Single Command Operations**: All operations can be completed with a single command
- 🎨 **Template Variables**: Support for template variable substitution and post-processing scripts
- 📱 **Interactive Interface**: User-friendly interactive command interface
- 🧪 **Complete Testing**: Includes MCP server functionality tests

## 🚀 Quick Start

### Install via NPM (Recommended)

```bash
# Global installation
npm install -g flexible-scaffold

# Install as project dependency
npm install flexible-scaffold

# Run directly with npx (no installation needed)
npx flexible-scaffold --help
```

**📋 NPM Package Details**:
- 📦 **Package Name**: `flexible-scaffold`
- 🏷️ **Version**: Latest stable version
- 🔗 **Repository**: [GitHub](https://github.com/lenuxo/flexible-scaffold)
- 📖 **Documentation**: This README file
- 🐛 **Issue Tracking**: [GitHub Issues](https://github.com/lenuxo/flexible-scaffold/issues)

### Install from Source

```bash
git clone <repository-url>
cd flexible-scaffold
npm install
npm run build
npm install -g .
```

### Build for Development

```bash
# Development mode
npm run dev

# Build production version
npm run build

# Start built version
npm start
```

### Global Installation (Developers)

```bash
# Method 1: Use npm link
npm run build
npm link

# Method 2: Globally install built package
npm run build
npm install -g .
```

## 🎯 Usage

### Basic Commands

```bash
# View help
flexible-scaffold --help

# Add scaffold template
flexible-scaffold add react-antd https://github.com/username/react-antd-template.git "React + Ant Design template"

# List all templates
flexible-scaffold list

# Create project
flexible-scaffold create react-antd my-new-project

# Interactive creation
flexible-scaffold create react-antd my-project --interactive

# Update specific template
flexible-scaffold update react-antd

# Update all templates
flexible-scaffold update

# Remove template
flexible-scaffold remove react-antd

# View template info
flexible-scaffold info react-antd

# Validate template
flexible-scaffold validate react-antd

# Clean invalid templates
flexible-scaffold cleanup

# Start interactive interface
flexible-scaffold interactive
```

### Configuration Management

```bash
# Display configuration
flexible-scaffold config --show

# Show configuration path
flexible-scaffold config --path

# Export configuration
flexible-scaffold config --export config-backup.json

# Import configuration
flexible-scaffold config --import config-backup.json
```

### AI Assistant Integration

```bash
# Use JSON output mode (suitable for AI calls)
SCAFFOLD_JSON_OUTPUT=true flexible-scaffold list

# Use installed package
npx flexible-scaffold --json list

# Use globally installed version
flexible-scaffold --json create react-antd my-project
```

### Command Options

| Option | Description |
|---|---|
| `--json` | Output in JSON format |
| `--interactive` | Use interactive mode |
| `--help` | Show help information |
| `--version` | Show version information |

## 🤖 MCP Integration

### Start MCP Server

```bash
# Using installed package
npx flexible-scaffold mcp

# Using globally installed version
flexible-scaffold mcp

# Development mode (from source)
npm run mcp
```

### NPM Package MCP Configuration

Add to configuration file (like Claude Desktop's `~/.config/claude-desktop/claude_desktop_config.json`):

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

### Global Installation MCP Configuration

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

### Global Installation MCP Configuration Example

```json
{
  "mcpServers": {
    "flexible-scaffold": {
      "command": "flexible-scaffold",
      "args": ["mcp"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

## 📂 Project Structure

```
flexible-scaffold/
├── src/                          # TypeScript source code
│   ├── types/                    # Type definitions
│   │   └── index.ts
│   ├── utils/                    # Utility functions
│   │   └── index.ts
│   ├── FlexibleScaffold.ts       # Core functionality class
│   ├── cli.ts                    # Command-line interface
│   ├── mcp-scaffold-server.ts    # MCP server
│   ├── test-mcp.ts              # MCP test script
│   └── index.ts                 # Entry file
├── scripts/                     # Script files
│   └── scaffold-ai.sh           # AI-friendly wrapper script
├── dist/                        # Compiled JavaScript files
├── tests/                       # Test files
├── docs/                        # Documentation
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run MCP tests
npm run test:mcp
```

## 🚀 Development

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/lenuxo/flexible-scaffold.git
cd flexible-scaffold

# Install dependencies
npm install

# Start development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run build` | Build TypeScript to JavaScript |
| `npm run dev` | Development mode with hot reload |
| `npm start` | Run built application |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting issues |
| `npm run clean` | Clean build directory |
| `npm run mcp` | Start MCP server in development |

## 📄 Template Development

### Template Structure

```
template-name/
├── template/                    # Template files
│   ├── package.json
│   ├── src/
│   └── ...
├── scaffold.json               # Template configuration
└── README.md                   # Template documentation
```

### Template Configuration (scaffold.json)

```json
{
  "name": "template-name",
  "description": "Template description",
  "version": "1.0.0",
  "variables": {
    "PROJECT_NAME": {
      "type": "string",
      "description": "Project name",
      "default": "my-project"
    }
  },
  "scripts": {
    "postCreate": "npm install"
  }
}
```

### Template Variables

Use `{{variableName}}` syntax in template files:

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

## 🔄 Continuous Integration

### GitHub Actions

The project includes GitHub Actions for:
- Automated testing on multiple Node.js versions
- Code quality checks
- Automated releases
- NPM publishing

## 📊 Performance

- **Fast startup**: Optimized for quick initialization
- **Memory efficient**: Minimal memory footprint
- **Template caching**: Local template caching for faster access
- **Parallel processing**: Concurrent template operations

## 🔒 Security

- Input validation and sanitization
- Secure template loading from trusted sources
- No arbitrary code execution
- Template signature verification (planned)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Maintain backward compatibility

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for public APIs

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Commander.js](https://github.com/tj/commander.js/) for CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Vitest](https://vitest.dev/) for testing framework

## 🏷️ Version History

- **v1.0.0** - Initial release with core functionality
  - Basic scaffold operations
  - Git template management
  - MCP server support
  - Interactive CLI
  - TypeScript support

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/lenuxo/flexible-scaffold/issues)
- 📖 **Documentation**: This README file
- 🌐 **NPM Registry**: [https://www.npmjs.com/package/flexible-scaffold](https://www.npmjs.com/package/flexible-scaffold)