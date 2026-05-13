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

    it('should return a success object when donation is saved', async () => {
      const mockData = {
        organization: 'Goodwill',
        date: new Date('2026-05-12'),
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 100 });

      const result = await saveDonation(mockData);

      expect(result).toEqual({
        success: true,
        donation: { id: 100 },
      });
    });

    it('should return a failure object with error message when prisma fails', async () => {
      const mockData = {
        organization: 'Goodwill',
        date: new Date('2026-05-12'),
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
