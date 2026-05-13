import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(__dirname, 'seed-data.csv');
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

    // Logic for "Category: Item" format
    let itemName = rawDescription;
    if (rawDescription.includes(':')) {
      itemName = rawDescription.split(':').slice(1).join(':').trim();
    }

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    await prisma.item.create({
      data: {
        categoryId: category.id,
        description: itemName,
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

