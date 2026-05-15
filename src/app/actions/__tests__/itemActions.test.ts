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
    it('should return items matching the search query', async () => {
      const mockItems = [
        {
          id: 1,
          description: 'Winter Coat',
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
              OR: [
                { description: { contains: 'Winter' } },
                { category: { name: { contains: 'Winter' } } },
              ],
            },
          ],
        },
        take: 20,
      }));
      expect(result).toEqual(mockItems);
    });

    it('should return items matching the category name', async () => {
      const mockItems = [
        {
          id: 2,
          description: 'Running Shoes',
          categoryId: 2,
          category: { id: 2, name: "Men's Footwear" },
        },
      ];

      prismaMock.item.findMany.mockResolvedValue(mockItems as never[]);

      const result = await searchItems("Men's");

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { description: { contains: "Men's" } },
                { category: { name: { contains: "Men's" } } },
              ],
            },
          ],
        },
      }));
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if no query is provided', async () => {
      const result = await searchItems('');
      expect(result).toEqual([]);
      expect(prismaMock.item.findMany).not.toHaveBeenCalled();
    });
  });
});
