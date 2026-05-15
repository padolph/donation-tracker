import { getSettings, updateSettings } from '../settingsActions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
      });

      const result = await getSettings();

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.32);
      expect(prisma.appSettings.upsert).toHaveBeenCalled();
    });

    it('should return existing settings', async () => {
      const existingSettings = {
        id: 1,
        marginalTaxRate: 0.25,
        updatedAt: new Date(),
      };
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue(existingSettings);

      const result = await getSettings();

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.25);
      expect(prisma.appSettings.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('updateSettings', () => {
    it('should update settings and revalidate path', async () => {
      const mockData = { marginalTaxRate: 0.35 };
      (prisma.appSettings.upsert as jest.Mock).mockResolvedValue({ 
        id: 1, 
        marginalTaxRate: 0.35,
        updatedAt: new Date()
      });

      const result = await updateSettings(mockData);

      expect(result.success).toBe(true);
      expect(result.settings?.marginalTaxRate).toBe(0.35);
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
