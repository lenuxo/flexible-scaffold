import { vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.SCAFFOLD_CONFIG_DIR = path.join(os.tmpdir(), 'scaffold-test');

// 全局测试设置
beforeEach(() => {
  // 清理测试目录
  try {
    fs.removeSync(process.env.SCAFFOLD_CONFIG_DIR);
  } catch (error) {
    // 忽略清理错误
  }
});

afterAll(() => {
  // 最终清理
  try {
    fs.removeSync(process.env.SCAFFOLD_CONFIG_DIR);
  } catch (error) {
    // 忽略清理错误
  }
});