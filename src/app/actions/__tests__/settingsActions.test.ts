import { getSettings, updateSettings } from '../settingsActions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import path from 'path';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    appSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('settingsActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings if none exist and create them', async () => {
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.appSettings.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        marginalTaxRate: 0.32,
        estimatedAGI: 0.0,
      });

      const result = await getSettings();

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.32);
      expect(result.settings?.estimatedAGI).toBe(0.0);
      expect(prisma.appSettings.upsert).toHaveBeenCalled();
      expect(result.databasePath).toBeDefined();
      expect(result.storagePath).toBe(path.join(process.cwd(), 'storage', 'donations'));
    });

    it('should return existing settings', async () => {
      const existingSettings = {
        id: 1,
        marginalTaxRate: 0.25,
        estimatedAGI: 75000.0,
        updatedAt: new Date(),
      };
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue(existingSettings);

      const result = await getSettings();

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.25);
      expect(result.settings?.estimatedAGI).toBe(75000.0);
      expect(prisma.appSettings.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.databasePath).toBeDefined();
      expect(result.storagePath).toBe(path.join(process.cwd(), 'storage', 'donations'));
    });

    it('should resolve databasePath from DATABASE_URL env var', async () => {
      const originalEnv = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'file:/mock/path/production.db';
      
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        marginalTaxRate: 0.32,
      });

      const result = await getSettings();
      expect(result.success).toBe(true);
      expect(result.databasePath).toBe('/mock/path/production.db');
      
      process.env.DATABASE_URL = originalEnv;
    });

    it('should resolve databasePath as absolute if relative in env var', async () => {
      const originalEnv = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'file:./prisma/dev.db';
      
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        marginalTaxRate: 0.32,
      });

      const result = await getSettings();
      expect(result.success).toBe(true);
      expect(result.databasePath?.endsWith('prisma/dev.db')).toBe(true);
      expect(result.databasePath?.startsWith('/')).toBe(true);
      
      process.env.DATABASE_URL = originalEnv;
    });

    it('should resolve storagePath from IMAGE_STORAGE_PATH env var', async () => {
      const originalEnv = process.env.IMAGE_STORAGE_PATH;
      process.env.IMAGE_STORAGE_PATH = '/mock/storage/path';
      
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        marginalTaxRate: 0.32,
      });

      const result = await getSettings();
      expect(result.success).toBe(true);
      expect(result.storagePath).toBe('/mock/storage/path');
      
      process.env.IMAGE_STORAGE_PATH = originalEnv;
    });
  });

  describe('updateSettings', () => {
    it('should update settings and revalidate path', async () => {
      const mockData = { marginalTaxRate: 0.35, estimatedAGI: 85000.0 };
      (prisma.appSettings.upsert as jest.Mock).mockResolvedValue({ 
        id: 1, 
        marginalTaxRate: 0.35,
        estimatedAGI: 85000.0,
        updatedAt: new Date()
      });

      const result = await updateSettings(mockData);

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.35);
      expect(result.settings?.estimatedAGI).toBe(85000.0);
      expect(prisma.appSettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        update: mockData,
        create: { id: 1, ...mockData },
      }));
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('should return an error if update fails', async () => {
      (prisma.appSettings.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));
      const result = await updateSettings({ marginalTaxRate: 0.35 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
