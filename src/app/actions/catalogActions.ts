'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, UNAUTHORIZED_ERROR } from '@/lib/authGuard';
import { prisma } from '@/lib/prisma';
import {
  applyCatalogPlan,
  catalogToCsv,
  parseCatalogCsv,
  planCatalogUpdate,
  type CatalogChange,
  type CatalogPlan,
  type CatalogRowError,
} from '../../../prisma/catalogValues';

const MAX_CSV_BYTES = 5 * 1024 * 1024;
/** How many changes and errors a preview sends back to the page. */
const PREVIEW_LIMIT = 100;

export interface CatalogImportSummary {
  added: number;
  updated: number;
  unchanged: number;
  skippedCustom: number;
  errors: number;
}

export type ExportCatalogResult = { success: true; csv: string } | { success: false; error: string };

export type PreviewCatalogResult =
  | { success: true; summary: CatalogImportSummary; changes: CatalogChange[]; errors: CatalogRowError[] }
  | { success: false; error: string };

export type ApplyCatalogResult =
  | { success: true; summary: CatalogImportSummary }
  | { success: false; error: string };

export async function exportCatalog(): Promise<ExportCatalogResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: UNAUTHORIZED_ERROR };
  }

  try {
    const items = await prisma.item.findMany({
      where: { isCustomItem: false },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { description: 'asc' }],
    });

    const csv = catalogToCsv(
      items.map((item) => ({
        category: item.category.name,
        description: item.description,
        high: item.defaultHigh,
        medium: item.defaultMedium,
      }))
    );
    return { success: true, csv };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to export catalog' };
  }
}

/**
 * Reads the CSV from the form: either an uploaded `file`, or `source=bundled`
 * for the seed-data.csv shipped with this version of the app.
 */
async function readCatalogSource(formData: FormData): Promise<{ text: string } | { error: string }> {
  if (formData.get('source') === 'bundled') {
    return { text: await fs.promises.readFile(path.join(process.cwd(), 'prisma', 'seed-data.csv'), 'utf-8') };
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string' || file.size === 0) return { error: 'No file provided' };
  if (!file.name.toLowerCase().endsWith('.csv')) return { error: 'Please choose a .csv file' };
  if (file.size > MAX_CSV_BYTES) return { error: 'File is larger than 5MB' };
  return { text: await file.text() };
}

async function planFromForm(
  formData: FormData
): Promise<{ plan: CatalogPlan; errors: CatalogRowError[] } | { error: string }> {
  const source = await readCatalogSource(formData);
  if ('error' in source) return source;

  const { rows, errors } = parseCatalogCsv(source.text);
  if (rows.length === 0 && errors.length > 0 && errors[0].line === 1) {
    return { error: errors[0].message };
  }

  return { plan: await planCatalogUpdate(prisma, rows), errors };
}

function summarize(plan: CatalogPlan, errors: CatalogRowError[]): CatalogImportSummary {
  return {
    added: plan.added,
    updated: plan.updated,
    unchanged: plan.unchanged,
    skippedCustom: plan.skippedCustom,
    errors: errors.length,
  };
}

export async function previewCatalogImport(formData: FormData): Promise<PreviewCatalogResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: UNAUTHORIZED_ERROR };
  }

  try {
    const result = await planFromForm(formData);
    if ('error' in result) return { success: false, error: result.error };

    return {
      success: true,
      summary: summarize(result.plan, result.errors),
      changes: result.plan.changes.slice(0, PREVIEW_LIMIT),
      errors: result.errors.slice(0, PREVIEW_LIMIT),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to read catalog file' };
  }
}

/** Applies the valid rows; rows with errors are skipped, as the preview showed. */
export async function applyCatalogImport(formData: FormData): Promise<ApplyCatalogResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: UNAUTHORIZED_ERROR };
  }

  try {
    const result = await planFromForm(formData);
    if ('error' in result) return { success: false, error: result.error };

    await applyCatalogPlan(prisma, result.plan);
    revalidatePath('/', 'layout');

    return { success: true, summary: summarize(result.plan, result.errors) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to import catalog' };
  }
}
