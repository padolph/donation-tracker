/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  CATALOG_HEADER,
  applyCatalogPlan,
  catalogToCsv,
  parseCatalogCsv,
  planCatalogUpdate,
  type CatalogDb,
} from '../catalogValues';

const HEADER = CATALOG_HEADER.join(',');

describe('parseCatalogCsv', () => {
  it('parses rows in the seed format, stripping $ and deriving the leaf name', () => {
    const { rows, errors } = parseCatalogCsv(
      `${HEADER}\nAutomotive Supplies,Automotive: Amplifier,$81.71,$57.20\n`
    );

    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        line: 2,
        category: 'Automotive Supplies',
        description: 'Automotive: Amplifier',
        leafName: 'Amplifier',
        high: 81.71,
        medium: 57.2,
      },
    ]);
  });

  it('accepts plain numbers, thousands separators and quoted fields', () => {
    const { rows, errors } = parseCatalogCsv(
      `${HEADER}\n"Clothing, Men","Clothing: Coat, Wool",1200,"$1,050.5"\n`
    );

    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      category: 'Clothing, Men',
      description: 'Clothing: Coat, Wool',
      leafName: 'Coat, Wool',
      high: 1200,
      medium: 1050.5,
    });
  });

  it('treats a blank value as "leave alone" (null), not zero', () => {
    const { rows, errors } = parseCatalogCsv(`${HEADER}\nKitchen,Kitchen: Blender,$20.00,\n`);

    expect(errors).toEqual([]);
    expect(rows[0].high).toBe(20);
    expect(rows[0].medium).toBeNull();
  });

  it('uses the whole description as the leaf name when there is no colon', () => {
    const { rows } = parseCatalogCsv(`${HEADER}\nKitchen,Toaster,$10.00,$5.00\n`);
    expect(rows[0].leafName).toBe('Toaster');
  });

  it('rounds values to cents', () => {
    const { rows } = parseCatalogCsv(`${HEADER}\nKitchen,Kitchen: Pan,10.005,4.444\n`);
    expect(rows[0].high).toBe(10.01);
    expect(rows[0].medium).toBe(4.44);
  });

  it('reports a missing required column and returns no rows', () => {
    const { rows, errors } = parseCatalogCsv('Item Category,Item Description,High Quality Value\nA,B,1\n');

    expect(rows).toEqual([]);
    expect(errors).toEqual([
      { line: 1, message: 'Missing column(s): Medium Quality Value' },
    ]);
  });

  it('reports bad rows by line number and keeps the good ones', () => {
    const csv = [
      HEADER,
      'Kitchen,Kitchen: Pan,$10.00,$5.00',
      ',Kitchen: Pot,$10.00,$5.00',
      'Kitchen,,$10.00,$5.00',
      'Kitchen,Kitchen: Wok,ten,$5.00',
      'Kitchen,Kitchen: Kettle,-1,$5.00',
      'Kitchen,Kitchen: Mixer,$4.00,$5.00',
      'Kitchen,Kitchen: Pan,$11.00,$6.00',
    ].join('\n');

    const { rows, errors } = parseCatalogCsv(csv);

    expect(rows.map((r) => r.description)).toEqual(['Kitchen: Pan']);
    expect(errors).toEqual([
      { line: 3, message: 'Item Category is required' },
      { line: 4, message: 'Item Description is required' },
      { line: 5, message: 'High Quality Value "ten" is not a valid amount' },
      { line: 6, message: 'High Quality Value "-1" is not a valid amount' },
      { line: 7, message: 'High Quality Value is lower than Medium Quality Value' },
      { line: 8, message: 'Duplicate of line 2 (Kitchen / Kitchen: Pan)' },
    ]);
  });

  it('reports a malformed CSV instead of throwing', () => {
    const { rows, errors } = parseCatalogCsv(`${HEADER}\n"Kitchen,Kitchen: Pan,1,1\n`);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/Could not read CSV/);
  });

  it('parses the bundled seed-data.csv without errors', () => {
    const text = fs.readFileSync(path.join(__dirname, '..', 'seed-data.csv'), 'utf-8');
    const { rows, errors } = parseCatalogCsv(text);

    expect(errors).toEqual([]);
    expect(rows.length).toBeGreaterThan(1000);
  });
});

describe('catalogToCsv', () => {
  it('writes the seed format, quoting where needed, and round-trips through the parser', () => {
    const csv = catalogToCsv([
      { category: 'Kitchen', description: 'Kitchen: Pan', high: 10, medium: 5.5 },
      { category: 'Clothing, Men', description: 'Clothing: "Good" Coat', high: null, medium: 3 },
    ]);

    expect(csv.split('\n')[0]).toBe(HEADER);
    expect(csv).toContain('Kitchen,Kitchen: Pan,$10.00,$5.50');
    expect(csv).toContain('"Clothing, Men","Clothing: ""Good"" Coat",,$3.00');

    const { rows, errors } = parseCatalogCsv(csv);
    expect(errors).toEqual([]);
    expect(rows.map(({ category, description, high, medium }) => ({ category, description, high, medium }))).toEqual([
      { category: 'Kitchen', description: 'Kitchen: Pan', high: 10, medium: 5.5 },
      { category: 'Clothing, Men', description: 'Clothing: "Good" Coat', high: null, medium: 3 },
    ]);
  });
});

type ExistingItem = {
  id: number;
  description: string;
  defaultHigh: number | null;
  defaultMedium: number | null;
  isCustomItem: boolean;
  category: { id: number; name: string };
};

function mockDb(items: ExistingItem[]) {
  const tx = {
    item: { update: jest.fn(), create: jest.fn() },
    category: {
      upsert: jest.fn(({ where }: { where: { name: string } }) =>
        Promise.resolve({ id: 100, name: where.name })
      ),
    },
  };
  const db = {
    item: { findMany: jest.fn().mockResolvedValue(items) },
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { db: db as unknown as CatalogDb, tx, raw: db };
}

const kitchen = { id: 1, name: 'Kitchen' };
const existing: ExistingItem[] = [
  { id: 10, description: 'Kitchen: Pan', defaultHigh: 10, defaultMedium: 5, isCustomItem: false, category: kitchen },
  { id: 11, description: 'Kitchen: Pot', defaultHigh: 8, defaultMedium: 4, isCustomItem: false, category: kitchen },
  { id: 12, description: 'Grandma Pie Dish', defaultHigh: 50, defaultMedium: 40, isCustomItem: true, category: kitchen },
];

function rowsFrom(lines: string[]) {
  return parseCatalogCsv([HEADER, ...lines].join('\n')).rows;
}

describe('planCatalogUpdate', () => {
  it('classifies rows as updated, added, unchanged and skipped custom items', async () => {
    const { db } = mockDb(existing);
    const rows = rowsFrom([
      'Kitchen,Kitchen: Pan,$12.00,$6.00',
      'Kitchen,Kitchen: Pot,$8.00,$4.00',
      'Kitchen,Grandma Pie Dish,$1.00,$1.00',
      'Kitchen,Kitchen: Wok,$9.00,$4.50',
      'Garden,Garden: Rake,$7.00,',
    ]);

    const plan = await planCatalogUpdate(db, rows);

    expect(plan).toMatchObject({ added: 2, updated: 1, unchanged: 1, skippedCustom: 1 });
    expect(plan.changes).toEqual([
      {
        kind: 'updated', itemId: 10, category: 'Kitchen', description: 'Kitchen: Pan', leafName: 'Pan',
        oldHigh: 10, oldMedium: 5, newHigh: 12, newMedium: 6,
      },
      {
        kind: 'added', category: 'Kitchen', description: 'Kitchen: Wok', leafName: 'Wok',
        oldHigh: null, oldMedium: null, newHigh: 9, newMedium: 4.5,
      },
      {
        kind: 'added', category: 'Garden', description: 'Garden: Rake', leafName: 'Rake',
        oldHigh: null, oldMedium: null, newHigh: 7, newMedium: null,
      },
    ]);
  });

  it('keeps the existing value where the file leaves a cell blank', async () => {
    const { db } = mockDb(existing);
    const plan = await planCatalogUpdate(db, rowsFrom(['Kitchen,Kitchen: Pan,,$6.00', 'Kitchen,Kitchen: Pot,,']));

    expect(plan).toMatchObject({ updated: 1, unchanged: 1 });
    expect(plan.changes[0]).toMatchObject({ itemId: 10, newHigh: 10, newMedium: 6 });
  });

  it('only adds missing items in addMissing mode', async () => {
    const { db } = mockDb(existing);
    const plan = await planCatalogUpdate(
      db,
      rowsFrom(['Kitchen,Kitchen: Pan,$12.00,$6.00', 'Kitchen,Kitchen: Wok,$9.00,$4.50']),
      { mode: 'addMissing' }
    );

    expect(plan).toMatchObject({ added: 1, updated: 0, unchanged: 1 });
    expect(plan.changes.map((c) => c.description)).toEqual(['Kitchen: Wok']);
  });
});

describe('applyCatalogPlan', () => {
  it('writes updates and additions in one transaction, creating categories once', async () => {
    const { db, tx, raw } = mockDb(existing);
    const plan = await planCatalogUpdate(
      db,
      rowsFrom([
        'Kitchen,Kitchen: Pan,$12.00,$6.00',
        'Garden,Garden: Rake,$7.00,',
        'Garden,Garden: Hoe,$5.00,$3.00',
      ])
    );

    await applyCatalogPlan(db, plan);

    expect(raw.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.item.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { defaultHigh: 12, defaultMedium: 6 },
    });
    expect(tx.category.upsert).toHaveBeenCalledTimes(1);
    expect(tx.category.upsert).toHaveBeenCalledWith({
      where: { name: 'Garden' },
      update: {},
      create: { name: 'Garden' },
    });
    expect(tx.item.create).toHaveBeenCalledWith({
      data: {
        categoryId: 100,
        description: 'Garden: Rake',
        leafName: 'Rake',
        defaultHigh: 7,
        defaultMedium: null,
      },
    });
    expect(tx.item.create).toHaveBeenCalledTimes(2);
  });

  it('does nothing when there are no changes', async () => {
    const { db, raw } = mockDb(existing);
    await applyCatalogPlan(db, await planCatalogUpdate(db, rowsFrom(['Kitchen,Kitchen: Pot,$8.00,$4.00'])));
    expect(raw.$transaction).not.toHaveBeenCalled();
  });
});
