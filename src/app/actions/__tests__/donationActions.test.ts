import { saveDonation } from '../donationActions';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    donationEvent: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('donationActions', () => {
  describe('saveDonation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return a success object when item donation is saved', async () => {
      const mockData = {
        organization: 'Goodwill',
        date: new Date('2026-05-12'),
        type: 'ITEMS',
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 100 });

      const result = await saveDonation(mockData);

      expect(result).toEqual({
        success: true,
        donation: { id: 100 },
      });
      expect(prisma.donationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'ITEMS' })
        })
      );
    });

    it('should correctly save a CASH donation', async () => {
      const mockData = {
        organization: 'Red Cross',
        date: new Date('2026-05-12'),
        type: 'CASH',
        cashAmount: 1500,
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 101 });

      await saveDonation(mockData);

      expect(prisma.donationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'CASH',
            cashAmount: 1500,
          })
        })
      );
    });

    it('should correctly save an ASSETS donation', async () => {
      const mockData = {
        organization: 'University',
        date: new Date('2026-05-12'),
        type: 'ASSETS',
        assetTicker: 'AAPL',
        assetShares: 10.5,
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 102 });

      await saveDonation(mockData);

      expect(prisma.donationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'ASSETS',
            assetTicker: 'AAPL',
            assetShares: 10.5,
          })
        })
      );
    });

    it('should return a failure object with error message when prisma fails', async () => {
      const mockData = {
        organization: 'Goodwill',
        date: new Date('2026-05-12'),
        type: 'ITEMS',
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockRejectedValue(new Error('Database unique constraint failed'));

      const result = await saveDonation(mockData);

      expect(result).toEqual({
        success: false,
        error: 'Database unique constraint failed',
      });
    });
  });
});
