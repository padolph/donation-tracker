import { searchItems } from '../itemActions';
import { prisma } from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('@/lib/prisma', () => {
  const { mockDeep } = jest.requireActual('jest-mock-extended');
  return {
    __esModule: true,
    prisma: mockDeep(),
  };
});

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

beforeEach(() => {
  prismaMock.item.findMany.mockReset();
});

describe('itemActions', () => {
  describe('searchItems', () => {
    it('should return items matching the search query in description', async () => {
      const mockItems = [
        {
          id: 1,
          description: 'Winter Coat',
          leafName: 'Coat',
          categoryId: 1,
          defaultHigh: 50,
          defaultMedium: 25,
          userHigh: null,
          userMedium: null,
          isCustomItem: false,
          category: { id: 1, name: 'Clothing' },
        },
      ];

      prismaMock.item.findMany.mockResolvedValue(mockItems as never[]);

      const result = await searchItems('Winter');

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          AND: [
            {
              description: { contains: 'Winter' },
            },
          ],
        },
      }));
      expect(result).toEqual(mockItems);
    });

    it('should NOT return items matching only the category name', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);

      await searchItems('Clothing');

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          AND: [
            {
              description: { contains: 'Clothing' },
            },
          ],
        },
      }));
      // Verify category is NOT in the where clause
      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(JSON.stringify(call?.where)).not.toContain('category');
    });

    it('should return an empty array if no query is provided', async () => {
      const result = await searchItems('');
      expect(result).toEqual([]);
      expect(prismaMock.item.findMany).not.toHaveBeenCalled();
    });
  });
});
