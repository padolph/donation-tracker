import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { applyCatalogPlan, parseCatalogCsv, planCatalogUpdate } from './catalogValues';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(process.cwd(), 'prisma', 'seed-data.csv');
  const { rows, errors } = parseCatalogCsv(fs.readFileSync(csvFilePath, 'utf-8'));

  for (const error of errors) {
    console.warn(`seed-data.csv line ${error.line}: ${error.message}`);
  }

  // Only add missing items: Docker re-runs the seed on every boot, and
  // overwriting values here would undo a user's catalog import.
  const plan = await planCatalogUpdate(prisma, rows, { mode: 'addMissing' });
  await applyCatalogPlan(prisma, plan);

  console.log(`Seed completed: ${plan.added} item(s) added, ${plan.unchanged + plan.skippedCustom} already present.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
