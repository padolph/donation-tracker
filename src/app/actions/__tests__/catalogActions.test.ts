/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import { exportCatalog, previewCatalogImport, applyCatalogImport } from '../catalogActions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DeepMockProxy } from 'jest-mock-extended';
import { UNAUTHORIZED_ERROR } from '@/lib/authGuard';

// Server actions check the session themselves; default to a logged-in user.
let mockSession: { user: { name: string } } | null = { user: { name: 'Test User' } };
jest.mock('@/auth', () => ({
  auth: () => Promise.resolve(mockSession),
}));

jest.mock('@/lib/prisma', () => {
  const { mockDeep } = jest.requireActual('jest-mock-extended');
  return {
    __esModule: true,
    prisma: mockDeep(),
  };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

const HEADER = 'Item Category,Item Description,High Quality Value,Medium Quality Value';
const kitchen = { id: 1, name: 'Kitchen' };
const catalog = [
  { id: 10, categoryId: 1, description: 'Kitchen: Pan', leafName: 'Pan', defaultHigh: 10, defaultMedium: 5, userHigh: null, userMedium: null, isCustomItem: false, category: kitchen },
  { id: 11, categoryId: 1, description: 'Kitchen: Pot', leafName: 'Pot', defaultHigh: 8, defaultMedium: 4, userHigh: null, userMedium: null, isCustomItem: false, category: kitchen },
  { id: 12, categoryId: 1, description: 'Grandma Pie Dish', leafName: 'Grandma Pie Dish', defaultHigh: 50, defaultMedium: 40, userHigh: null, userMedium: null, isCustomItem: true, category: kitchen },
];

function csvForm(text: string, name = 'values.csv') {
  const formData = new FormData();
  formData.append('file', new File([text], name, { type: 'text/csv' }));
  return formData;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { user: { name: 'Test User' } };
  prismaMock.item.findMany.mockResolvedValue(catalog as never);
  prismaMock.$transaction.mockImplementation(((fn: (tx: typeof prisma) => Promise<unknown>) => fn(prismaMock)) as never);
  prismaMock.category.upsert.mockResolvedValue({ id: 2, name: 'Garden' });
});

describe('catalogActions', () => {
  describe('authentication', () => {
    it.each([
      ['exportCatalog', () => exportCatalog()],
      ['previewCatalogImport', () => previewCatalogImport(csvForm(HEADER))],
      ['applyCatalogImport', () => applyCatalogImport(csvForm(HEADER))],
    ])('%s refuses without a session', async (_name, call) => {
      mockSession = null;
      expect(await call()).toEqual({ success: false, error: UNAUTHORIZED_ERROR });
      expect(prismaMock.item.findMany).not.toHaveBeenCalled();
    });
  });

  describe('exportCatalog', () => {
    it('exports catalog items, leaving out custom items, in the import format', async () => {
      const result = await exportCatalog();

      expect(prismaMock.item.findMany).toHaveBeenCalledWith({
        where: { isCustomItem: false },
        include: { category: true },
        orderBy: [{ category: { name: 'asc' } }, { description: 'asc' }],
      });
      expect(result).toEqual({
        success: true,
        csv: `${HEADER}\nKitchen,Kitchen: Pan,$10.00,$5.00\nKitchen,Kitchen: Pot,$8.00,$4.00\nKitchen,Grandma Pie Dish,$50.00,$40.00\n`,
      });
    });
  });

  describe('previewCatalogImport', () => {
    it('summarizes changes and row errors without writing anything', async () => {
      const result = await previewCatalogImport(
        csvForm([HEADER, 'Kitchen,Kitchen: Pan,$12.00,$6.00', 'Garden,Garden: Rake,$7.00,$3.00', 'Kitchen,Kitchen: Pot,oops,'].join('\n'))
      );

      expect(result).toEqual({
        success: true,
        summary: { added: 1, updated: 1, unchanged: 0, skippedCustom: 0, errors: 1 },
        changes: [
          expect.objectContaining({ kind: 'updated', description: 'Kitchen: Pan', oldHigh: 10, newHigh: 12 }),
          expect.objectContaining({ kind: 'added', description: 'Garden: Rake', newHigh: 7 }),
        ],
        errors: [{ line: 4, message: 'High Quality Value "oops" is not a valid amount' }],
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('caps the change and error lists it returns', async () => {
      const lines = Array.from({ length: 150 }, (_, i) => `Garden,Garden: Thing ${i},$1.00,$1.00`);
      const bad = Array.from({ length: 150 }, (_, i) => `Garden,,${i},`);
      const result = await previewCatalogImport(csvForm([HEADER, ...lines, ...bad].join('\n')));

      if (!result.success) throw new Error(result.error);
      expect(result.summary.added).toBe(150);
      expect(result.summary.errors).toBe(150);
      expect(result.changes).toHaveLength(100);
      expect(result.errors).toHaveLength(100);
    });

    it('previews the bundled catalog when asked for it', async () => {
      const formData = new FormData();
      formData.append('source', 'bundled');

      const result = await previewCatalogImport(formData);

      const bundled = fs.readFileSync(path.join(process.cwd(), 'prisma', 'seed-data.csv'), 'utf-8');
      const bundledRows = bundled.trim().split('\n').length - 1;
      if (!result.success) throw new Error(result.error);
      expect(result.summary.added + result.summary.updated + result.summary.unchanged + result.summary.skippedCustom).toBe(bundledRows);
      expect(result.summary.errors).toBe(0);
    });

    it('rejects a missing file', async () => {
      expect(await previewCatalogImport(new FormData())).toEqual({ success: false, error: 'No file provided' });
    });

    it('rejects a file that is not a CSV', async () => {
      expect(await previewCatalogImport(csvForm(HEADER, 'values.xlsx'))).toEqual({
        success: false,
        error: 'Please choose a .csv file',
      });
    });

    it('rejects a file over 5MB', async () => {
      const big = csvForm('x'.repeat(5 * 1024 * 1024 + 1));
      expect(await previewCatalogImport(big)).toEqual({ success: false, error: 'File is larger than 5MB' });
    });

    it('fails when the header is wrong', async () => {
      expect(await previewCatalogImport(csvForm('Name,Price\nPan,1\n'))).toEqual({
        success: false,
        error: 'Missing column(s): Item Category, Item Description, High Quality Value, Medium Quality Value',
      });
    });
  });

  describe('applyCatalogImport', () => {
    it('applies the valid rows and refreshes pages that show values', async () => {
      const result = await applyCatalogImport(
        csvForm([HEADER, 'Kitchen,Kitchen: Pan,$12.00,$6.00', 'Kitchen,Grandma Pie Dish,$1.00,$1.00', 'Garden,,1,1'].join('\n'))
      );

      expect(result).toEqual({
        success: true,
        summary: { added: 0, updated: 1, unchanged: 0, skippedCustom: 1, errors: 1 },
      });
      expect(prismaMock.item.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { defaultHigh: 12, defaultMedium: 6 },
      });
      expect(prismaMock.item.update).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('reports a database failure', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('disk full'));
      const result = await applyCatalogImport(csvForm([HEADER, 'Kitchen,Kitchen: Pan,$12.00,$6.00'].join('\n')));
      expect(result).toEqual({ success: false, error: 'disk full' });
    });
  });
});
