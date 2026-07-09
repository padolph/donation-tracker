import { getReportData } from '../reportActions';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    donationEvent: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('reportActions', () => {
  describe('getReportData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches and groups donation data correctly by organization and date', async () => {
      const mockDonations = [
        {
          id: 1,
          date: new Date('2025-05-10T10:00:00Z'),
          organizationId: 1,
          type: 'ITEMS',
          organization: { id: 1, name: 'Goodwill' },
          items: [
            {
              id: 1,
              quantity: 2,
              condition: 'Medium',
              lockedValue: 10,
              item: {
                id: 1,
                description: 'T-Shirt',
                category: { name: 'Clothing' },
              },
            },
          ],
        },
        {
          id: 2,
          date: new Date('2025-05-15T10:00:00Z'),
          organizationId: 1,
          type: 'ITEMS',
          organization: { id: 1, name: 'Goodwill' },
          items: [
            {
              id: 2,
              quantity: 1,
              condition: 'High',
              lockedValue: 50,
              item: {
                id: 2,
                description: 'Winter Coat',
                category: { name: 'Clothing' },
              },
            },
          ],
        },
        {
          id: 3,
          date: new Date('2025-06-01T10:00:00Z'),
          organizationId: 2,
          type: 'CASH',
          cashAmount: 100,
          organization: { id: 2, name: 'Red Cross' },
          items: [],
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);

      const result = await getReportData(2025);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const report = result.data!;
      
      expect(report.organizations).toHaveLength(2);
      expect(report.organizations[0].name).toBe('Goodwill');
      expect(report.organizations[1].name).toBe('Red Cross');

      expect(report.organizations[0].totalValue).toBe(70);
      expect(report.organizations[0].donations).toHaveLength(2);

      expect(report.organizations[1].totalValue).toBe(100);
      expect(report.organizations[1].donations).toHaveLength(1);
      expect(report.organizations[1].donations[0].items[0].valuationMethod).toBe('Face Value');

      expect(report.grandTotal).toBe(170);
    });

    it('returns an empty report if no donations found for the year', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getReportData(2025);

      expect(result.success).toBe(true);
      expect(result.data?.organizations).toHaveLength(0);
      expect(result.data?.grandTotal).toBe(0);
    });

    it('handles database errors gracefully', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getReportData(2025);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      
      consoleSpy.mockRestore();
    });

    it('correctly calculates asset donation totals (Reproduction of Bug)', async () => {
      const mockDonations = [
        {
          id: 4,
          date: new Date('2025-07-01T10:00:00Z'),
          organizationId: 3,
          type: 'ASSETS',
          assetTicker: 'AAPL',
          assetShares: 10,
          cashAmount: 1500, // Total Value of the donation
          organization: { id: 3, name: 'University' },
          items: [],
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);

      const result = await getReportData(2025);

      expect(result.success).toBe(true);
      const assetReport = result.data?.organizations.find(o => o.name === 'University');
      
      expect(assetReport?.totalValue).toBe(1500);
      
      const item = assetReport?.donations[0].items[0];
      expect(item?.description).toBe('AAPL');
      expect(item?.quantity).toBe(10);
      expect(item?.unitValue).toBe(1500);
      expect(item?.totalValue).toBe(1500);
      expect(item?.valuationMethod).toBe('Market Quotations');
    });

    it('correctly formats mileage donation in reports', async () => {
      const mockDonations = [
        {
          id: 5,
          date: new Date('2025-08-01T10:00:00Z'),
          organizationId: 4,
          type: 'MILEAGE',
          milesDriven: 100,
          parkingAndTolls: 10,
          mileageRate: 0.14,
          organization: { id: 4, name: 'Food Bank' },
          items: [],
        },
      ];

      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);

      const result = await getReportData(2025);

      expect(result.success).toBe(true);
      const mileageReport = result.data?.organizations.find(o => o.name === 'Food Bank');
      
      expect(mileageReport?.totalValue).toBe(24);
      
      const item = mileageReport?.donations[0].items[0];
      expect(item?.description).toBe('Volunteer Mileage: 100 miles @ $0.14/mi');
      expect(item?.category).toBe('Mileage');
      expect(item?.condition).toBe('N/A');
      expect(item?.quantity).toBe(100);
      expect(item?.unitValue).toBe(0.14);
      expect(item?.totalValue).toBe(24);
      expect(item?.valuationMethod).toBe('Standard Mileage Rate');
    });
  });
});
