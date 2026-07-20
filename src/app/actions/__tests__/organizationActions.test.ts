import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../organizationActions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    donationEvent: {
      count: jest.fn(),
    },
  },
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('organizationActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizations', () => {
    it('should return organizations with aggregated total donated amounts', async () => {
      const mockOrgs = [
        {
          id: 1,
          name: 'Org 1',
          address: null,
          taxId: null,
          defaultCategory: null,
          donations: [
            {
              items: [{ quantity: 1, lockedValue: 10 }, { quantity: 2, lockedValue: 5 }],
              cashAmount: null,
              assetShares: null,
            },
            {
              items: [],
              cashAmount: 50,
              assetShares: null,
            }
          ]
        },
        {
          id: 2,
          name: 'Org 2',
          address: '123 Main St',
          taxId: '12-3456789',
          donations: []
        }
      ];

      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);

      const result = await getOrganizations();

      expect(result).toHaveLength(2);
      expect(result[0].totalDonated).toBe(70); // (1*10) + (2*5) + 50
      expect(result[0].donationCount).toBe(2);
      expect(result[1].totalDonated).toBe(0);
      expect(result[1].donationCount).toBe(0);
      expect(prisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
        include: {
          donations: {
            include: {
              items: true
            }
          }
        }
      }));
    });

    it('should correctly aggregate MILEAGE donations into totalDonated even if cashAmount is null', async () => {
      const mockOrgs = [
        {
          id: 1,
          name: 'Org 1',
          address: null,
          taxId: null,
          donations: [
            {
              type: 'MILEAGE',
              items: [],
              cashAmount: null,
              milesDriven: 50,
              mileageRate: 0.14,
              parkingAndTolls: 3,
            },
          ],
        },
      ];

      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);

      const result = await getOrganizations();

      expect(result).toHaveLength(1);
      // (50 * 0.14) + 3 = 7 + 3 = 10
      expect(result[0].totalDonated).toBe(10);
    });
  });

  describe('createOrganization', () => {
    it('should create an organization and revalidate path', async () => {
      const mockData = { name: 'Updated Org', address: '456 St', taxId: '987' };
      (prisma.organization.create as jest.Mock).mockResolvedValue({ id: 3, ...mockData });

      const result = await createOrganization(mockData);

      expect(result.success).toBe(true);
      expect(result.organization?.id).toBe(3);
      expect(prisma.organization.create).toHaveBeenCalledWith({ data: mockData });
      expect(revalidatePath).toHaveBeenCalledWith('/organizations');
    });

    it('should return an error if creation fails', async () => {
      (prisma.organization.create as jest.Mock).mockRejectedValue(new Error('Unique constraint'));
      const result = await createOrganization({ name: 'Fail Org' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unique constraint');
    });
  });

  describe('updateOrganization', () => {
    it('should update an organization and revalidate path', async () => {
      const mockData = { name: 'Updated Org', address: '456 St', taxId: '987' };
      (prisma.organization.update as jest.Mock).mockResolvedValue({ id: 3, ...mockData });

      const result = await updateOrganization(3, mockData);

      expect(result.success).toBe(true);
      expect(prisma.organization.update).toHaveBeenCalledWith({ where: { id: 3 }, data: mockData });
      expect(revalidatePath).toHaveBeenCalledWith('/organizations');
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an organization if no donations exist', async () => {
      (prisma.donationEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.organization.delete as jest.Mock).mockResolvedValue({ id: 3 });
      const result = await deleteOrganization(3);

      expect(result.success).toBe(true);
      expect(prisma.donationEvent.count).toHaveBeenCalledWith({ where: { organizationId: 3 } });
      expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(revalidatePath).toHaveBeenCalledWith('/organizations');
    });

    it('should return validation error if donations exist', async () => {
      (prisma.donationEvent.count as jest.Mock).mockResolvedValue(1);
      const result = await deleteOrganization(3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete organization because it has associated donations. Please delete all donations to this organization first.');
      expect(prisma.donationEvent.count).toHaveBeenCalledWith({ where: { organizationId: 3 } });
      expect(prisma.organization.delete).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return an error if delete fails', async () => {
      (prisma.donationEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.organization.delete as jest.Mock).mockRejectedValue(new Error('Foreign key constraint'));
      const result = await deleteOrganization(3);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Foreign key constraint');
    });
  });
});
