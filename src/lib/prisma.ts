import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

if (process.env.NODE_ENV === 'development') {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:' + path.resolve('./prisma/dev.db');
  } else if (process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
    if (!path.isAbsolute(rawPath)) {
      process.env.DATABASE_URL = 'file:' + path.resolve(rawPath);
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.startsWith('file:') && process.env.NODE_ENV === 'development') {
  const rawPath = databaseUrl.replace(/^file:/, '');
  const dbPath = path.resolve(rawPath);
  if (!fs.existsSync(dbPath)) {
    console.log(`Database file not found at ${dbPath}. Running initial migrations and seed...`);
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'inherit',
      });
      execSync('npx prisma db seed', {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'inherit',
      });
      console.log('Database initialized and seeded successfully.');
    } catch (error) {
      console.error('Failed to initialize database programmatically:', error);
    }
  } else {
    console.log(`Database file found at ${dbPath}. Running migrations to ensure it is up-to-date...`);
    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'inherit',
      });
      console.log('Database migrations applied successfully.');
    } catch (error) {
      console.error('Failed to run database migrations programmatically:', error);
    }
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
