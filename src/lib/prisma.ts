/* eslint-disable security/detect-non-literal-fs-filename */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../utils/crypto';

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

  // One-time Dev Password Migration
  const devPassword = process.env.APP_PASSWORD;
  if (devPassword && !devPassword.startsWith('scrypt:')) {
    const hashed = hashPassword(devPassword);
    process.env.APP_PASSWORD = hashed;

    const envLocalPath = path.join(process.cwd(), '.env.local');
    try {
      if (fs.existsSync(envLocalPath)) {
        let envContent = fs.readFileSync(envLocalPath, 'utf8');
        if (envContent.includes('APP_PASSWORD=')) {
          envContent = envContent.replace(/APP_PASSWORD=.*/, `APP_PASSWORD=${hashed}`);
        } else {
          envContent += `\nAPP_PASSWORD=${hashed}\n`;
        }
        fs.writeFileSync(envLocalPath, envContent, 'utf8');
        console.log('Successfully upgraded dev password in .env.local to secure scrypt hash.');
      }
    } catch (e) {
      console.error('Failed to auto-migrate dev password in .env.local:', e);
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
