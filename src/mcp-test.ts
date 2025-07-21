// src/test-mcp.ts - MCP服务器测试脚本

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { logger } from './utils';

interface MCPMessage {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class MCPTester {
  private serverProcess: ChildProcess | null = null;
  private testResults: { [key: string]: boolean } = {};

  /**
   * 启动MCP服务器
   */
  public async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, 'mcp-scaffold-server.js');
      
      logger.info('🚀 启动MCP服务器...');
      this.serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      
      this.serverProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log('服务器输出:', output.trim());
        
        if (output.includes('MCP Server connected successfully')) {
          resolve();
        }
      });

      this.serverProcess.on('error', (error) => {
        logger.error(`服务器启动失败: ${error}`);
        reject(error);
      });

      // 2秒后如果没有成功消息，也认为启动成功
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          logger.info('✅ 服务器可能已启动（未收到确认消息）');
          resolve();
        }
      }, 2000);
    });
  }

  /**
   * 发送MCP消息
   */
  public async sendMessage(message: MCPMessage): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('服务器未启动'));
        return;
      }

      let response = '';
      let timeoutId: NodeJS.Timeout;

      const onData = (data: Buffer) => {
        response += data.toString();
        
        try {
          // 尝试解析JSON响应
          const jsonResponse = JSON.parse(response) as MCPResponse;
          clearTimeout(timeoutId);
          this.serverProcess?.stdout?.off('data', onData);
          resolve(jsonResponse);
        } catch (e) {
          // 还不是完整的JSON，继续等待
        }
      };

      this.serverProcess.stdout?.on('data', onData);

      // 设置超时
      timeoutId = setTimeout(() => {
        this.serverProcess?.stdout?.off('data', onData);
        reject(new Error('消息超时'));
      }, 5000);

      // 发送消息
      logger.info(`📤 发送消息: ${JSON.stringify(message, null, 2)}`);
      this.serverProcess.stdin?.write(JSON.stringify(message) + '\n');
    });
  }

  /**
   * 测试初始化
   */
  public async testInitialize(): Promise<boolean> {
    logger.info('\n🧪 测试初始化...');
    
    const initMessage: MCPMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: {
            listChanged: true
          }
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };

    try {
      const response = await this.sendMessage(initMessage);
      
      if (response.error) {
        logger.error(`初始化失败: ${response.error.message}`);
        this.testResults.initialize = false;
        return false;
      }
      
      logger.success(`初始化成功: ${JSON.stringify(response.result)}`);
      this.testResults.initialize = true;
      return true;
    } catch (error) {
      logger.error(`初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      this.testResults.initialize = false;
      return false;
    }
  }

  /**
   * 测试工具列表
   */
  public async testListTools(): Promise<boolean> {
    logger.info('\n🧪 测试工具列表...');
    
    const listToolsMessage: MCPMessage = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list"
    };

    try {
      const response = await this.sendMessage(listToolsMessage);
      
      if (response.error) {
        logger.error(`获取工具列表失败: ${response.error.message}`);
        this.testResults.listTools = false;
        return false;
      }
      
      logger.success('工具列表获取成功:');
      
      if (response.result && response.result.tools) {
        response.result.tools.forEach((tool: any) => {
          console.log(`  🔧 ${tool.name}: ${tool.description || '无描述'}`);
        });
        logger.info(`总共发现 ${response.result.tools.length} 个工具`);
      }
      
      this.testResults.listTools = true;
      return true;
    } catch (error) {
      logger.error(`获取工具列表失败: ${error instanceof Error ? error.message : String(error)}`);
      this.testResults.listTools = false;
      return false;
    }
  }

  /**
   * 测试调用工具
   */
  public async testCallTool(): Promise<boolean> {
    logger.info('\n🧪 测试调用工具 (list_scaffold_templates)...');
    
    const callToolMessage: MCPMessage = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "list_scaffold_templates",
        arguments: {}
      }
    };

    try {
      const response = await this.sendMessage(callToolMessage);
      
      if (response.error) {
        logger.error(`工具调用失败: ${response.error.message}`);
        this.testResults.callTool = false;
        return false;
      }
      
      logger.success('工具调用成功:');
      
      if (response.result && response.result.content) {
        response.result.content.forEach((content: any) => {
          console.log('📋 结果:', content.text);
        });
      }
      
      this.testResults.callTool = true;
      return true;
    } catch (error) {
      logger.error(`工具调用失败: ${error instanceof Error ? error.message : String(error)}`);
      this.testResults.callTool = false;
      return false;
    }
  }

  /**
   * 测试资源列表
   */
  public async testListResources(): Promise<boolean> {
    logger.info('\n🧪 测试资源列表...');
    
    const listResourcesMessage: MCPMessage = {
      jsonrpc: "2.0",
      id: 4,
      method: "resources/list"
    };

    try {
      const response = await this.sendMessage(listResourcesMessage);
      
      if (response.error) {
        logger.error(`获取资源列表失败: ${response.error.message}`);
        this.testResults.listResources = false;
        return false;
      }
      
      logger.success('资源列表获取成功:');
      
      if (response.result && response.result.resources) {
        response.result.resources.forEach((resource: any) => {
          console.log(`  📄 ${resource.uri}: ${resource.description || resource.name || '无描述'}`);
        });
        logger.info(`总共发现 ${response.result.resources.length} 个资源`);
      }
      
      this.testResults.listResources = true;
      return true;
    } catch (error) {
      logger.error(`获取资源列表失败: ${error instanceof Error ? error.message : String(error)}`);
      this.testResults.listResources = false;
      return false;
    }
  }

  /**
   * 测试提示列表
   */
  public async testListPrompts(): Promise<boolean> {
    logger.info('\n🧪 测试提示列表...');
    
    const listPromptsMessage: MCPMessage = {
      jsonrpc: "2.0",
      id: 5,
      method: "prompts/list"
    };

    try {
      const response = await this.sendMessage(listPromptsMessage);
      
      if (response.error) {
        logger.error(`获取提示列表失败: ${response.error.message}`);
        this.testResults.listPrompts = false;
        return false;
      }
      
      logger.success('提示列表获取成功:');
      
      if (response.result && response.result.prompts) {
        response.result.prompts.forEach((prompt: any) => {
          console.log(`  💬 ${prompt.name}: ${prompt.description || '无描述'}`);
        });
        logger.info(`总共发现 ${response.result.prompts.length} 个提示`);
      }
      
      this.testResults.listPrompts = true;
      return true;
    } catch (error) {
      logger.error(`获取提示列表失败: ${error instanceof Error ? error.message : String(error)}`);
      this.testResults.listPrompts = false;
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  public async runTests(): Promise<boolean> {
    try {
      await this.startServer();
      
      const tests = [
        { name: 'initialize', fn: () => this.testInitialize() },
        { name: 'listTools', fn: () => this.testListTools() },
        { name: 'callTool', fn: () => this.testCallTool() },
        { name: 'listResources', fn: () => this.testListResources() },
        { name: 'listPrompts', fn: () => this.testListPrompts() },
      ];

      for (const test of tests) {
        await test.fn();
        // 在测试之间添加小延迟
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('\n📊 测试结果汇总:');
      console.log('  初始化:', this.testResults.initialize ? '✅ 通过' : '❌ 失败');
      console.log('  工具列表:', this.testResults.listTools ? '✅ 通过' : '❌ 失败');
      console.log('  工具调用:', this.testResults.callTool ? '✅ 通过' : '❌ 失败');
      console.log('  资源列表:', this.testResults.listResources ? '✅ 通过' : '❌ 失败');
      console.log('  提示列表:', this.testResults.listPrompts ? '✅ 通过' : '❌ 失败');

      const passedCount = Object.values(this.testResults).filter(Boolean).length;
      const totalCount = Object.keys(this.testResults).length;
      
      console.log(`\n🏆 总体结果: ${passedCount}/${totalCount} 测试通过`);
      
      return passedCount === totalCount;
      
    } catch (error) {
      logger.error(`测试过程中发生错误: ${error}`);
      return false;
    } finally {
      this.stopServer();
    }
  }

  /**
   * 运行特定测试
   */
  public async runSpecificTest(testName: keyof typeof this.testResults): Promise<boolean> {
    try {
      await this.startServer();
      
      let result = false;
      switch (testName) {
        case 'initialize':
          result = await this.testInitialize();
          break;
        case 'listTools':
          result = await this.testListTools();
          break;
        case 'callTool':
          result = await this.testCallTool();
          break;
        case 'listResources':
          result = await this.testListResources();
          break;
        case 'listPrompts':
          result = await this.testListPrompts();
          break;
        default:
          logger.error(`未知的测试: ${testName}`);
          return false;
      }
      
      logger.info(`\n🏆 ${testName} 测试结果: ${result ? '✅ 通过' : '❌ 失败'}`);
      return result;
      
    } catch (error) {
      logger.error(`测试 ${testName} 时发生错误: ${error}`);
      return false;
    } finally {
      this.stopServer();
    }
  }

  /**
   * 停止MCP服务器
   */
  public stopServer(): void {
    if (this.serverProcess && !this.serverProcess.killed) {
      logger.info('🛑 停止MCP服务器...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }

  /**
   * 重置测试结果
   */
  public resetTestResults(): void {
    this.testResults = {};
  }
}

/**
 * 命令行接口
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const tester = new MCPTester();
  
  // 处理退出信号
  const cleanup = () => {
    console.log('\n👋 收到退出信号，正在清理...');
    tester.stopServer();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  try {
    let success = false;
    
    switch (command) {
      case 'all':
      case undefined:
        success = await tester.runTests();
        break;
        
      case 'init':
      case 'initialize':
        success = await tester.runSpecificTest('initialize');
        break;
        
      case 'tools':
        success = await tester.runSpecificTest('listTools');
        break;
        
      case 'call':
        success = await tester.runSpecificTest('callTool');
        break;
        
      case 'resources':
        success = await tester.runSpecificTest('listResources');
        break;
        
      case 'prompts':
        success = await tester.runSpecificTest('listPrompts');
        break;
        
      case 'help':
      case '--help':
      case '-h':
        console.log(`
🧪 MCP服务器测试工具

用法:
  npm run test:mcp [命令]

命令:
  all                运行所有测试（默认）
  init, initialize   测试初始化
  tools             测试工具列表
  call              测试工具调用
  resources         测试资源列表
  prompts           测试提示列表
  help              显示帮助信息

示例:
  npm run test:mcp
  npm run test:mcp tools
  npm run test:mcp call
        `);
        process.exit(0);
        break;
        
      default:
        logger.error(`未知命令: ${command}`);
        logger.info('使用 help 查看可用命令');
        process.exit(1);
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logger.error(`测试失败: ${error}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    logger.error(`测试运行失败: ${error}`);
    process.exit(1);
  });
}