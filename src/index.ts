#!/usr/bin/env node

// src/index.ts - CLI 入口文件

import { CLI } from './cli';
import { logger } from './utils';

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    const cli = new CLI();
    await cli.run(process.argv);
  } catch (error) {
    logger.error(`CLI 运行失败: ${error instanceof Error ? error.message : String(error)}`);
    
    // 在JSON输出模式下返回错误信息
    if (process.env.SCAFFOLD_JSON_OUTPUT === 'true') {
      console.log(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
    
    process.exit(1);
  }
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

/**
 * 处理未处理的Promise拒绝
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

/**
 * 处理退出信号
 */
process.on('SIGINT', () => {
  logger.info('👋 收到退出信号，正在清理...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('👋 收到终止信号，正在清理...');
  process.exit(0);
});

// 运行主函数
if (require.main === module) {
  main();
}

export { CLI } from './cli';
export { FlexibleScaffold } from './FlexibleScaffold';
export { ScaffoldMCPServer, createScaffoldMCPServer } from './mcp-scaffold-server';
export * from './types';
export * from './utils';