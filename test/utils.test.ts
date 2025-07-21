import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  ensureDir,
  pathExists,
  removeDir,
  copyDir,
  executeCommand,
  safeExecuteCommand,
  processTemplateVariables,
  cleanGitFiles,
  cleanScaffoldFiles,
  isValidGitUrl,
  isValidProjectName,
  formatDate,
  generateDefaultVariables,
  readJsonFile,
  writeJsonFile,
  safeReadJsonFile
} from '../src/utils';

describe('Utils', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), 'utils-test-' + Date.now());
    ensureDir(testDir);
  });

  afterEach(() => {
    try {
      fs.removeSync(testDir);
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('file system utilities', () => {
    it('should ensure directory exists', () => {
      const newDir = path.join(testDir, 'new-dir');
      ensureDir(newDir);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should check if path exists', () => {
      const existingPath = path.join(testDir, 'existing.txt');
      fs.writeFileSync(existingPath, 'test');
      
      expect(pathExists(existingPath)).toBe(true);
      expect(pathExists(path.join(testDir, 'nonexistent.txt'))).toBe(false);
    });

    it('should remove directory', () => {
      const dirToRemove = path.join(testDir, 'remove-me');
      fs.mkdirSync(dirToRemove, { recursive: true });
      fs.writeFileSync(path.join(dirToRemove, 'file.txt'), 'test');
      
      expect(fs.existsSync(dirToRemove)).toBe(true);
      removeDir(dirToRemove);
      expect(fs.existsSync(dirToRemove)).toBe(false);
    });

    it('should copy directory', () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      
      fs.mkdirSync(sourceDir, { recursive: true });
      fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'test content');
      
      copyDir(sourceDir, targetDir);
      expect(fs.existsSync(targetDir)).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'file.txt'))).toBe(true);
      expect(fs.readFileSync(path.join(targetDir, 'file.txt'), 'utf8')).toBe('test content');
    });
  });

  describe('command execution utilities', () => {
    it('should execute command successfully', () => {
      expect(() => {
        safeExecuteCommand('echo "test"');
      }).not.toThrow();
    });

    it('should handle command execution errors', () => {
      const result = safeExecuteCommand('nonexistent-command-12345');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('template variables processing', () => {
    it('should process template variables correctly', () => {
      const sourceFile = path.join(testDir, 'template.txt');
      const targetFile = path.join(testDir, 'processed.txt');
      
      fs.writeFileSync(sourceFile, 'Hello {{PROJECT_NAME}}, created on {{CREATION_DATE}}');
      
      const variables = {
        PROJECT_NAME: 'my-app',
        CREATION_DATE: '2024-01-01',
        CURRENT_YEAR: '2024'
      };
      
      fs.copySync(sourceFile, targetFile);
      processTemplateVariables(targetFile, variables);
      
      const content = fs.readFileSync(targetFile, 'utf8');
      expect(content).toBe('Hello my-app, created on 2024-01-01');
    });

    it('should handle nested directories correctly', () => {
      const nestedDir = path.join(testDir, 'nested', 'deep');
      fs.mkdirSync(nestedDir, { recursive: true });
      
      const filePath = path.join(nestedDir, 'file.txt');
      fs.writeFileSync(filePath, 'Project: {{PROJECT_NAME}}');
      
      const variables = { PROJECT_NAME: 'nested-test' };
      processTemplateVariables(testDir, variables);
      
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toBe('Project: nested-test');
    });
  });

  describe('git and scaffold file utilities', () => {
    it('should clean git files', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'config'), 'test config');
      
      expect(fs.existsSync(gitDir)).toBe(true);
      cleanGitFiles(testDir);
      expect(fs.existsSync(gitDir)).toBe(false);
    });

    it('should clean scaffold configuration files', () => {
      const scaffoldConfig = path.join(testDir, 'scaffold.config.js');
      const scaffoldConfigTs = path.join(testDir, 'scaffold.config.ts');
      
      fs.writeFileSync(scaffoldConfig, 'module.exports = {};');
      fs.writeFileSync(scaffoldConfigTs, 'export default {};');
      fs.writeFileSync(path.join(testDir, 'keep-me.txt'), 'keep this file');
      
      cleanScaffoldFiles(testDir);
      expect(fs.existsSync(scaffoldConfig)).toBe(false);
      expect(fs.existsSync(scaffoldConfigTs)).toBe(false);
      expect(fs.existsSync(path.join(testDir, 'keep-me.txt'))).toBe(true);
    });
  });

  describe('validation utilities', () => {
    it('should validate git URLs correctly', () => {
      expect(isValidGitUrl('https://github.com/user/repo.git')).toBe(true);
      expect(isValidGitUrl('git@github.com:user/repo.git')).toBe(true);
      expect(isValidGitUrl('ssh://git@host.com/repo.git')).toBe(true);
      expect(isValidGitUrl('invalid-url')).toBe(false);
      expect(isValidGitUrl('ftp://example.com/repo.git')).toBe(false);
    });

    it('should validate project names correctly', () => {
      expect(isValidProjectName('valid-name')).toBe(true);
      expect(isValidProjectName('valid_name')).toBe(true);
      expect(isValidProjectName('valid123')).toBe(true);
      expect(isValidProjectName('invalid name')).toBe(false);
      expect(isValidProjectName('invalid@name')).toBe(false);
      expect(isValidProjectName('')).toBe(false);
    });
  });

  describe('formatting utilities', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
    });

    it('should generate default variables', () => {
      const variables = generateDefaultVariables('test-project');
      
      expect(variables.PROJECT_NAME).toBe('test-project');
      expect(variables.CURRENT_YEAR).toBe(new Date().getFullYear().toString());
      expect(variables.CREATION_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('JSON file utilities', () => {
    it('should read and write JSON files correctly', () => {
      const testData = { name: 'test', value: 123 };
      const filePath = path.join(testDir, 'test.json');
      
      writeJsonFile(filePath, testData);
      const readData = readJsonFile<typeof testData>(filePath);
      expect(readData).toEqual(testData);
    });

    it('should safe read JSON file with default value', () => {
      const defaultValue = { default: true };
      const nonExistentFile = path.join(testDir, 'nonexistent.json');
      
      const result = safeReadJsonFile(nonExistentFile, defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });
});