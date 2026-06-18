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
      const year = 2025;
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
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({ marginalTaxRate: 0.32, estimatedAGI: 0.0 });

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
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({ marginalTaxRate: 0.32, estimatedAGI: 0.0 });

      const result = await getDashboardStats(2025);

      expect(result.success).toBe(true);
      expect(result.stats?.totalDonated).toBe(0);
      expect(result.stats?.organizationCount).toBe(0);
      expect(result.stats?.taxSavings).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      const result = await getDashboardStats(2025);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fetch failed');
    });

    it('should calculate OBBBA compliance tax savings when year is 2026', async () => {
      const year = 2026;
      const mockDonations = [
        {
          type: 'ITEMS',
          items: [
            { quantity: 2, lockedValue: 500 },
          ],
          cashAmount: null,
          assetShares: null,
          organizationId: 1,
        },
        {
          type: 'CASH',
          items: [],
          cashAmount: 2000,
          assetShares: null,
          organizationId: 2,
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue({ marginalTaxRate: 0.32, estimatedAGI: 100000 });

      const result = await getDashboardStats(year);

      expect(result.success).toBe(true);
      expect(result.stats?.totalDonated).toBe(3000);
      expect(result.stats?.itemsTotal).toBe(1000);
      expect(result.stats?.cashTotal).toBe(2000);
      
      // floor = 500. Total deductible = 3000. Savings = (3000 - 500) * 0.32 = 800
      expect(result.stats?.taxSavings).toBe(800);
      expect(result.stats?.estimatedAGI).toBe(100000);
      expect(result.stats?.calculationState).toBe('active');
      expect(result.stats?.floor).toBe(500);
      expect(result.stats?.floorRemaining).toBe(0);
      expect(result.stats?.allowedContributionsRemaining).toBe(136000);
      expect(result.stats?.cashRoomRemaining).toBe(57000);
      expect(result.stats?.physicalRoomRemaining).toBe(49000);
      expect(result.stats?.assetRoomRemaining).toBe(30000);
    });

    it('should use default values as fallback for marginal tax rate (0.22) and estimated AGI (100k) if settings do not exist', async () => {
      const year = 2026;
      const mockDonations = [
        {
          type: 'ITEMS',
          items: [
            { quantity: 2, lockedValue: 500 },
          ],
          cashAmount: null,
          assetShares: null,
          organizationId: 1,
        },
        {
          type: 'CASH',
          items: [],
          cashAmount: 2000,
          assetShares: null,
          organizationId: 2,
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.appSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getDashboardStats(year);

      expect(result.success).toBe(true);
      expect(result.stats?.estimatedAGI).toBe(100000);
      expect(result.stats?.marginalTaxRate).toBe(0.22);
      
      // floor = 500. Total deductible = 3000. Savings = (3000 - 500) * 0.22 = 550
      expect(result.stats?.taxSavings).toBe(550);
      expect(result.stats?.calculationState).toBe('active');
    });
  });
});
