import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(process.cwd(), 'prisma', 'seed-data.csv');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} items. Seeding...`);

  for (const rawRecord of records) {
    const record = rawRecord as Record<string, string>;
    const rawDescription = record['Item Description'] || '';
    const rawHigh = record['High Quality Value'] || '';
    const rawMedium = record['Medium Quality Value'] || '';
    const categoryName = record['Item Category'] || 'General';

    if (!rawDescription) continue;

    // Clean monetary values ($81.71 -> 81.71)
    const cleanHigh = parseFloat(rawHigh.replace(/[^0-9.]/g, '')) || 0;
    const cleanMedium = parseFloat(rawMedium.replace(/[^0-9.]/g, '')) || 0;

    // Logic for leafName vs description
    const fullDescription = rawDescription;
    let leafName = rawDescription;
    if (rawDescription.includes(':')) {
      const parts = rawDescription.split(':').map(p => p.trim());
      leafName = parts[parts.length - 1];
    }

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    await prisma.item.upsert({
      where: {
        categoryId_description: {
          categoryId: category.id,
          description: fullDescription,
        },
      },
      update: {
        leafName: leafName,
        defaultHigh: cleanHigh,
        defaultMedium: cleanMedium,
      },
      create: {
        categoryId: category.id,
        description: fullDescription,
        leafName: leafName,
        defaultHigh: cleanHigh,
        defaultMedium: cleanMedium,
      },
    });
  }
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

