import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlexibleScaffold } from '../src/FlexibleScaffold';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock console methods to avoid output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ name: 'test-project' })
  }
}));

describe('CLI Integration', () => {
  let scaffold: FlexibleScaffold;
  let testConfigDir: string;

  beforeEach(() => {
    testConfigDir = path.join(os.tmpdir(), 'cli-test-' + Date.now());
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

  describe('Integration tests with real templates', () => {
    it('should add and list real React portfolio template', async () => {
      const result = await scaffold.addTemplate(
        'cli-react-portfolio',
        'https://github.com/chetanverma16/react-portfolio-template.git',
        'React Portfolio Template'
      );

      expect(result.success).toBe(true);
      
      const listResult = scaffold.listTemplates();
      expect(listResult.success).toBe(true);
      expect(listResult.templates?.some(t => t.name === 'cli-react-portfolio')).toBe(true);
    });

    it('should add and remove real portfolio template', async () => {
      await scaffold.addTemplate(
        'cli-portfolio-remove',
        'https://github.com/soumyajit4419/Portfolio.git',
        'Portfolio Template'
      );

      const removeResult = scaffold.removeTemplate('cli-portfolio-remove');
      expect(removeResult.success).toBe(true);
      
      const listResult = scaffold.listTemplates();
      expect(listResult.templates?.some(t => t.name === 'cli-portfolio-remove')).toBe(false);
    });

    it('should add and update real React admin template', async () => {
      await scaffold.addTemplate(
        'cli-react-admin-update',
        'https://github.com/flatlogic/react-material-admin.git',
        'React Material Admin'
      );

      const updateResult = await scaffold.updateTemplate('cli-react-admin-update');
      expect(updateResult.success).toBe(true);
    });
  });

  describe('Scaffold operations', () => {
    it('should add template and get info', async () => {
      await scaffold.addTemplate(
        'cli-info-test',
        'https://github.com/chetanverma16/react-portfolio-template.git'
      );

      const infoResult = scaffold.getTemplateInfo('cli-info-test');
      expect(infoResult.success).toBe(true);
      expect(infoResult.data?.gitUrl).toBe('https://github.com/chetanverma16/react-portfolio-template.git');
    });

    it('should validate existing template', async () => {
      await scaffold.addTemplate(
        'cli-validate-test',
        'https://github.com/soumyajit4419/Portfolio.git'
      );

      const validateResult = scaffold.validateTemplate('cli-validate-test');
      expect(validateResult.success).toBe(true);
    });
  });
});