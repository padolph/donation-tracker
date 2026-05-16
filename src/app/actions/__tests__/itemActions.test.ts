import { searchItems, getCategories, getItemsByCategory } from '../itemActions';
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
  prismaMock.category.findMany.mockReset();
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

    it('should return an empty array if no query is provided', async () => {
      const result = await searchItems('');
      expect(result).toEqual([]);
      expect(prismaMock.item.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('should return all categories ordered by name', async () => {
      const mockCategories = [
        { id: 1, name: 'Automotive' },
        { id: 2, name: 'Clothing' },
      ];
      prismaMock.category.findMany.mockResolvedValue(mockCategories);

      const result = await getCategories();

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getItemsByCategory', () => {
    it('should return items for a specific category', async () => {
      const mockItems = [
        { id: 1, description: 'Item 1', categoryId: 1 },
      ];
      prismaMock.item.findMany.mockResolvedValue(mockItems as never[]);

      const result = await getItemsByCategory(1);

      expect(prismaMock.item.findMany).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        include: { category: true },
        orderBy: { description: 'asc' },
      });
      expect(result).toEqual(mockItems);
    });
  });
});
