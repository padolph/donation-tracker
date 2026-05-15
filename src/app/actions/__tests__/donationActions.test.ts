import { saveDonation, getDonations, deleteDonation, getDonationById, updateDonation } from '../donationActions';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    donationEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('donationActions', () => {
  describe('getDonations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch all donations when no filters are provided', async () => {
      const mockDonations = [
        { id: 1, date: new Date('2026-05-12'), organizationId: 1, type: 'ITEMS' }
      ];
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue(mockDonations);

      const result = await getDonations({});

      expect(result).toEqual({ success: true, donations: mockDonations });
      expect(prisma.donationEvent.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'desc' },
        include: {
          organization: true,
          items: {
            include: { item: true }
          },
          photos: true
        }
      });
    });

    it('should filter donations by organizationId', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getDonations({ organizationId: 2 });

      expect(prisma.donationEvent.findMany).toHaveBeenCalledWith({
        where: { organizationId: 2 },
        orderBy: { date: 'desc' },
        include: expect.any(Object)
      });
    });

    it('should filter donations by year', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getDonations({ year: 2026 });

      expect(prisma.donationEvent.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-12-31T23:59:59.999Z')
          }
        },
        orderBy: { date: 'desc' },
        include: expect.any(Object)
      });
    });

    it('should combine organizationId and year filters', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getDonations({ organizationId: 3, year: 2025 });

      expect(prisma.donationEvent.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 3,
          date: {
            gte: new Date('2025-01-01T00:00:00.000Z'),
            lte: new Date('2025-12-31T23:59:59.999Z')
          }
        },
        orderBy: { date: 'desc' },
        include: expect.any(Object)
      });
    });

    it('should return a failure object if database throws', async () => {
      (prisma.donationEvent.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getDonations({});

      expect(result).toEqual({ success: false, error: 'DB Error' });
      expect(consoleSpy).toHaveBeenCalledWith('CRITICAL: getDonations failed', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('saveDonation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return a success object when item donation is saved', async () => {
      const mockData = {
        organizationId: 1,
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
        organizationId: 2,
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
        organizationId: 3,
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
        organizationId: 1,
        date: new Date('2026-05-12'),
        type: 'ITEMS',
        items: [],
        photos: [],
      };

      (prisma.donationEvent.create as jest.Mock).mockRejectedValue(new Error('Database unique constraint failed'));

      // Temporarily mute console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await saveDonation(mockData);

      expect(result).toEqual({
        success: false,
        error: 'Database unique constraint failed',
      });

      // Assert that your app actually logged the error internally
      expect(consoleSpy).toHaveBeenCalledWith(
        'CRITICAL: saveDonation failed', 
        expect.any(Error)
      );

      // Restore the console back to normal
      consoleSpy.mockRestore();
    });
  });

  describe('deleteDonation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a donation event and return success', async () => {
      (prisma.donationEvent.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await deleteDonation(1);

      expect(result).toEqual({ success: true });
      expect(prisma.donationEvent.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return failure if database throws an error', async () => {
      (prisma.donationEvent.delete as jest.Mock).mockRejectedValue(new Error('Record not found'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await deleteDonation(1);

      expect(result).toEqual({ success: false, error: 'Record not found' });
      expect(consoleSpy).toHaveBeenCalledWith('CRITICAL: deleteDonation failed', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getDonationById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch a single donation by id', async () => {
      const mockDonation = { id: 1, type: 'ITEMS' };
      (prisma.donationEvent.findUnique as jest.Mock).mockResolvedValue(mockDonation);

      const result = await getDonationById(1);

      expect(result).toEqual({ success: true, donation: mockDonation });
      expect(prisma.donationEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          organization: true,
          items: {
            include: { item: true },
          },
          photos: true,
        },
      });
    });

    it('should return failure if donation is not found', async () => {
      (prisma.donationEvent.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getDonationById(1);

      expect(result).toEqual({ success: false, error: 'Donation not found' });
    });

    it('should return failure if database throws an error', async () => {
      (prisma.donationEvent.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getDonationById(1);

      expect(result).toEqual({ success: false, error: 'DB error' });
      expect(consoleSpy).toHaveBeenCalledWith('CRITICAL: getDonationById failed', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateDonation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update a donation event and sync items', async () => {
      const mockData = {
        organizationId: 1,
        date: new Date('2026-05-12'),
        type: 'ITEMS',
        items: [{ itemId: 10, quantity: 2, condition: 'High', lockedValue: 50 }],
        photos: [],
      };

      (prisma.donationEvent.update as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await updateDonation(1, mockData);

      expect(result).toEqual({ success: true, donation: { id: 1 } });
      expect(prisma.donationEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            organization: { connect: { id: 1 } },
            type: 'ITEMS',
            items: {
              deleteMany: {},
              create: [
                { itemId: 10, quantity: 2, condition: 'High', lockedValue: 50 },
              ],
            },
          }),
        })
      );
    });

    it('should handle failures gracefully', async () => {
      const mockData = {
        organizationId: 1,
        date: new Date('2026-05-12'),
        type: 'CASH',
        cashAmount: 100,
        items: [],
        photos: [],
      };

      (prisma.donationEvent.update as jest.Mock).mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await updateDonation(1, mockData);

      expect(result).toEqual({ success: false, error: 'Update failed' });
      consoleSpy.mockRestore();
    });
  });
});
