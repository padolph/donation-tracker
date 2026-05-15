import { getDashboardStats } from '../dashboardActions';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    donationEvent: {
      findMany: jest.fn(),
    },
    appSettings: {
      findUnique: jest.fn(),
    },
  },
}));

describe('dashboardActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should aggregate stats correctly for a given year', async () => {
      const year = 2026;
      const mockDonations = [
        {
          type: 'ITEMS',
          items: [
            { quantity: 2, lockedValue: 50 },
            { quantity: 1, lockedValue: 100 },
          ],
          cashAmount: null,
          assetShares: null,
          organizationId: 1,
        },
        {
          type: 'CASH',
          items: [],
          cashAmount: 500,
          assetShares: null,
          organizationId: 2,
        },
        {
          type: 'ASSETS',
          items: [],
          cashAmount: 1000,
          assetShares: 10,
          assetTicker: 'AAPL',
          organizationId: 1,
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({ marginalTaxRate: 0.32 });

      const result = await getDashboardStats(year);

      expect(result.success).toBe(true);
      expect(result.stats?.totalDonated).toBe(1700); // 200 (items) + 500 (cash) + 1000 (assets)
      expect(result.stats?.itemsTotal).toBe(200);
      expect(result.stats?.cashTotal).toBe(500);
      expect(result.stats?.assetsTotal).toBe(1000);
      expect(result.stats?.organizationCount).toBe(2);
      expect(result.stats?.taxSavings).toBe(544); // 1700 * 0.32
    });

    it('should return default stats if no donations exist', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({ marginalTaxRate: 0.32 });

      const result = await getDashboardStats(2026);

      expect(result.success).toBe(true);
      expect(result.stats?.totalDonated).toBe(0);
      expect(result.stats?.organizationCount).toBe(0);
      expect(result.stats?.taxSavings).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      const result = await getDashboardStats(2026);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fetch failed');
    });
  });
});
