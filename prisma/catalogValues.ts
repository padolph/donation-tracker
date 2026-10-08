/**
 * Item value catalog: the CSV format shared by the bundled seed data,
 * user imports and exports, plus the logic that applies it to the database.
 *
 * Lives under prisma/ (with relative imports only) so the Docker image can
 * compile it alongside seed.ts; the app imports it from here too.
 */
import { parse } from 'csv-parse/sync';
import type { Prisma, PrismaClient } from '@prisma/client';

export const CATALOG_HEADER = [
  'Item Category',
  'Item Description',
  'High Quality Value',
  'Medium Quality Value',
] as const;

const [CATEGORY_COL, DESCRIPTION_COL, HIGH_COL, MEDIUM_COL] = CATALOG_HEADER;

export interface CatalogRow {
  /** 1-based line number in the source file (the header is line 1). */
  line: number;
  category: string;
  description: string;
  leafName: string;
  /** null means "leave the current value alone". */
  high: number | null;
  medium: number | null;
}

export interface CatalogRowError {
  line: number;
  message: string;
}

export interface CatalogEntry {
  category: string;
  description: string;
  high: number | null;
  medium: number | null;
}

export interface CatalogChange {
  kind: 'added' | 'updated';
  itemId?: number;
  category: string;
  description: string;
  leafName: string;
  oldHigh: number | null;
  oldMedium: number | null;
  newHigh: number | null;
  newMedium: number | null;
}

export interface CatalogPlan {
  added: number;
  updated: number;
  unchanged: number;
  /** Rows matching a user's custom item, which imports never overwrite. */
  skippedCustom: number;
  changes: CatalogChange[];
}

/** The parts of PrismaClient the catalog needs, so tests can pass a stub. */
export type CatalogDb = Pick<PrismaClient, 'item' | '$transaction'>;

export function leafNameOf(description: string): string {
  if (!description.includes(':')) return description;
  const parts = description.split(':').map((p) => p.trim());
  return parts[parts.length - 1];
}

function roundCents(n: number): number {
  // Shift via the exponent so 10.005 rounds to 10.01, not 10.00.
  return Math.round(Number(`${n}e2`)) / 100;
}

/** Returns null for a blank cell, NaN for anything that isn't a non-negative amount. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return roundCents(parseFloat(cleaned));
}

function keyOf(category: string, description: string): string {
  return `${category}\u0000${description}`;
}

export function parseCatalogCsv(text: string): { rows: CatalogRow[]; errors: CatalogRowError[] } {
  let records: string[][];
  try {
    records = parse(text, { bom: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { rows: [], errors: [{ line: 1, message: `Could not read CSV: ${message}` }] };
  }

  const header = records[0] ?? [];
  const missing = CATALOG_HEADER.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return { rows: [], errors: [{ line: 1, message: `Missing column(s): ${missing.join(', ')}` }] };
  }
  const idx = {
    category: header.indexOf(CATEGORY_COL),
    description: header.indexOf(DESCRIPTION_COL),
    high: header.indexOf(HIGH_COL),
    medium: header.indexOf(MEDIUM_COL),
  };

  const rows: CatalogRow[] = [];
  const errors: CatalogRowError[] = [];
  const seen = new Map<string, number>();

  records.slice(1).forEach((record, i) => {
    const line = i + 2;
    const category = record[idx.category] ?? '';
    const description = record[idx.description] ?? '';
    const rawHigh = record[idx.high] ?? '';
    const rawMedium = record[idx.medium] ?? '';

    if (!category) return errors.push({ line, message: `${CATEGORY_COL} is required` });
    if (!description) return errors.push({ line, message: `${DESCRIPTION_COL} is required` });

    const high = parseAmount(rawHigh);
    if (Number.isNaN(high)) return errors.push({ line, message: `${HIGH_COL} "${rawHigh}" is not a valid amount` });
    const medium = parseAmount(rawMedium);
    if (Number.isNaN(medium)) return errors.push({ line, message: `${MEDIUM_COL} "${rawMedium}" is not a valid amount` });
    if (high !== null && medium !== null && high < medium) {
      return errors.push({ line, message: `${HIGH_COL} is lower than ${MEDIUM_COL}` });
    }

    const key = keyOf(category, description);
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      return errors.push({ line, message: `Duplicate of line ${firstLine} (${category} / ${description})` });
    }
    seen.set(key, line);

    rows.push({ line, category, description, leafName: leafNameOf(description), high, medium });
  });

  return { rows, errors };
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatAmount(value: number | null): string {
  return value === null ? '' : `$${value.toFixed(2)}`;
}

export function catalogToCsv(entries: CatalogEntry[]): string {
  const lines = [CATALOG_HEADER.join(',')];
  for (const e of entries) {
    lines.push(
      [csvField(e.category), csvField(e.description), formatAmount(e.high), formatAmount(e.medium)].join(',')
    );
  }
  return lines.join('\n') + '\n';
}

/**
 * Compares rows against the catalog. `update` (the default) sets new values on
 * existing items and adds missing ones; `addMissing` only adds missing items,
 * which is what seeding does so it never undoes a user's import.
 */
export async function planCatalogUpdate(
  db: CatalogDb,
  rows: CatalogRow[],
  options: { mode?: 'update' | 'addMissing' } = {}
): Promise<CatalogPlan> {
  const mode = options.mode ?? 'update';
  const items = await db.item.findMany({ include: { category: true } });
  const byKey = new Map(items.map((item) => [keyOf(item.category.name, item.description), item]));

  const plan: CatalogPlan = { added: 0, updated: 0, unchanged: 0, skippedCustom: 0, changes: [] };

  for (const row of rows) {
    const item = byKey.get(keyOf(row.category, row.description));

    if (!item) {
      plan.added++;
      plan.changes.push({
        kind: 'added',
        category: row.category,
        description: row.description,
        leafName: row.leafName,
        oldHigh: null,
        oldMedium: null,
        newHigh: row.high,
        newMedium: row.medium,
      });
      continue;
    }

    if (item.isCustomItem) {
      plan.skippedCustom++;
      continue;
    }

    const newHigh = row.high ?? item.defaultHigh;
    const newMedium = row.medium ?? item.defaultMedium;
    if (mode === 'addMissing' || (newHigh === item.defaultHigh && newMedium === item.defaultMedium)) {
      plan.unchanged++;
      continue;
    }

    plan.updated++;
    plan.changes.push({
      kind: 'updated',
      itemId: item.id,
      category: row.category,
      description: row.description,
      leafName: row.leafName,
      oldHigh: item.defaultHigh,
      oldMedium: item.defaultMedium,
      newHigh,
      newMedium,
    });
  }

  return plan;
}

/** Writes a plan's changes in a single transaction. */
export async function applyCatalogPlan(db: CatalogDb, plan: CatalogPlan): Promise<void> {
  if (plan.changes.length === 0) return;

  await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const categoryIds = new Map<string, number>();

      for (const change of plan.changes) {
        if (change.kind === 'updated') {
          await tx.item.update({
            where: { id: change.itemId },
            data: { defaultHigh: change.newHigh, defaultMedium: change.newMedium },
          });
          continue;
        }

        let categoryId = categoryIds.get(change.category);
        if (categoryId === undefined) {
          const category = await tx.category.upsert({
            where: { name: change.category },
            update: {},
            create: { name: change.category },
          });
          categoryId = category.id;
          categoryIds.set(change.category, categoryId);
        }

        await tx.item.create({
          data: {
            categoryId,
            description: change.description,
            leafName: change.leafName,
            defaultHigh: change.newHigh,
            defaultMedium: change.newMedium,
          },
        });
      }
    },
    // A first-time seed adds ~1,750 items; give it more than the 5s default.
    { timeout: 120_000 }
  );
}
