import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlexibleScaffold } from '../src/FlexibleScaffold';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('FlexibleScaffold', () => {
  let scaffold: FlexibleScaffold;
  let testConfigDir: string;

  beforeEach(() => {
    testConfigDir = path.join(os.tmpdir(), 'scaffold-test-' + Date.now());
    process.env.SCAFFOLD_CONFIG_DIR = testConfigDir;
    scaffold = new FlexibleScaffold();
  });

  afterEach(() => {
    try {
      fs.removeSync(testConfigDir);
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('addTemplate', () => {
    it('should add a new template successfully', async () => {
      const uniqueName = `test-template-${Date.now()}`;
      const result = await scaffold.addTemplate(
        uniqueName,
        'https://github.com/chetanverma16/react-portfolio-template.git',
        'React Portfolio Template'
      );

      expect(result.success).toBe(true);
    });

    it('should fail when template already exists', async () => {
      const uniqueName = `existing-template-${Date.now()}`;
      await scaffold.addTemplate(uniqueName, 'https://github.com/soumyajit4419/Portfolio.git');
      const result = await scaffold.addTemplate(uniqueName, 'https://github.com/soumyajit4419/Portfolio.git');

      expect(result.success).toBe(false);
    });

    it('should fail with invalid git URL', async () => {
      const result = await scaffold.addTemplate(`invalid-url-${Date.now()}`, 'not-a-git-url');

      expect(result.success).toBe(false);
    });
  });

  describe('listTemplates', () => {
    it('should return list structure', () => {
      const result = scaffold.listTemplates();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should return list of added templates', async () => {
      const uniqueName1 = `list-test-1-${Date.now()}`;
      const uniqueName2 = `list-test-2-${Date.now()}`;
      
      await scaffold.addTemplate(uniqueName1, 'https://github.com/flatlogic/react-material-admin.git', 'React Material Admin');
      await scaffold.addTemplate(uniqueName2, 'https://github.com/soumyajit4419/Portfolio.git', 'Portfolio Template');

      const result = scaffold.listTemplates();
      expect(result.success).toBe(true);
      expect(result.templates?.some(t => t.name === uniqueName1)).toBe(true);
      expect(result.templates?.some(t => t.name === uniqueName2)).toBe(true);
    });
  });

  describe('removeTemplate', () => {
    beforeEach(async () => {
      await scaffold.addTemplate('remove-test-template', 'https://github.com/chetanverma16/react-portfolio-template.git');
    });

    it('should remove existing template', () => {
      const result = scaffold.removeTemplate('remove-test-template');

      expect(result.success).toBe(true);
      expect(result.message).toContain('成功');
    });

    it('should fail when removing non-existent template', () => {
      const result = scaffold.removeTemplate('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
  });

  describe('updateTemplate', () => {
    beforeEach(async () => {
      await scaffold.addTemplate('update-test-template', 'https://github.com/soumyajit4419/Portfolio.git');
    });

    it('should update existing template', async () => {
      const result = await scaffold.updateTemplate('update-test-template');

      expect(result.success).toBe(true);
      expect(result.message).toContain('成功');
    });

    it('should fail when updating non-existent template', async () => {
      const result = await scaffold.updateTemplate('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
  });

  describe('validateTemplate', () => {
    beforeEach(async () => {
      await scaffold.addTemplate('validate-test-template', 'https://github.com/flatlogic/react-material-admin.git');
    });

    it('should validate existing template', () => {
      const result = scaffold.validateTemplate('validate-test-template');
      expect(result.success).toBe(true);
    });

    it('should fail when validating non-existent template', () => {
      const result = scaffold.validateTemplate('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
  });

  describe('getTemplateInfo', () => {
    it('should return info for existing template', async () => {
      const uniqueName = `info-test-template-${Date.now()}`;
      await scaffold.addTemplate(uniqueName, 'https://github.com/chetanverma16/react-portfolio-template.git', 'Info test template');

      const result = scaffold.getTemplateInfo(uniqueName);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(uniqueName);
      expect(result.data?.gitUrl).toBe('https://github.com/chetanverma16/react-portfolio-template.git');
    });

    it('should fail for non-existent template', () => {
      const result = scaffold.getTemplateInfo('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
  });

  describe('cleanupInvalidTemplates', () => {
    it('should clean up invalid templates', async () => {
      // 添加一个有效模板
      await scaffold.addTemplate('cleanup-valid-template', 'https://github.com/chetanverma16/react-portfolio-template.git');
      
      const result = scaffold.cleanupInvalidTemplates();

      expect(result.success).toBe(true);
      expect(typeof result.data?.cleanedCount).toBe('number');
    });
  });
});