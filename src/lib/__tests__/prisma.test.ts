import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// We mock the PrismaClient class to capture constructor arguments
jest.mock('@prisma/client', () => {
  const mPrismaClient = jest.fn().mockImplementation(() => ({}));
  return { PrismaClient: mPrismaClient };
});

describe('Prisma Client Initialization', () => {
  const originalEnv = { ...process.env };
  let spyExistsSync: jest.SpiedFunction<typeof fs.existsSync>;
  let spyMkdirSync: jest.SpiedFunction<typeof fs.mkdirSync>;
  let spyExecSync: jest.SpiedFunction<typeof child_process.execSync>;

  beforeEach(() => {
    jest.resetModules();
    delete (global as unknown as { prisma: unknown }).prisma;
    process.env = { ...originalEnv };
    
    /* eslint-disable @typescript-eslint/no-require-imports */
    const dynamicFs = require('fs');
    const dynamicChildProcess = require('child_process');
    /* eslint-enable @typescript-eslint/no-require-imports */
    
    spyExistsSync = jest.spyOn(dynamicFs, 'existsSync') as unknown as jest.SpiedFunction<typeof fs.existsSync>;
    spyMkdirSync = jest.spyOn(dynamicFs, 'mkdirSync').mockImplementation(() => {
      return '';
    }) as unknown as jest.SpiedFunction<typeof fs.mkdirSync>;
    spyExecSync = jest.spyOn(dynamicChildProcess, 'execSync').mockImplementation(() => {
      return Buffer.from('');
    }) as unknown as jest.SpiedFunction<typeof child_process.execSync>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass datasources override if process.env.DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'file:/tmp/test.db';
    
    // Import the mock client to assert on it
    const prismaModule = await import('@prisma/client');
    const MockPrismaClient = prismaModule.PrismaClient;
    
    // Require the prisma.ts file to trigger instantiation
    await import('../prisma');
    
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: 'file:/tmp/test.db',
          },
        },
      })
    );
  });

  it('should not pass datasources override if process.env.DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL;
    
    const prismaModule = await import('@prisma/client');
    const MockPrismaClient = prismaModule.PrismaClient;
    
    await import('../prisma');
    
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.not.objectContaining({
        datasources: expect.any(Object),
      })
    );
  });

  it('should default to file:./prisma/dev.db and run migrations/seed if database file does not exist in development', async () => {
    delete process.env.DATABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    
    spyExistsSync.mockReturnValue(false);
    
    const prismaModule = await import('@prisma/client');
    const MockPrismaClient = prismaModule.PrismaClient;
    
    await import('../prisma');
    
    expect(spyExistsSync).toHaveBeenCalledWith(expect.stringContaining(path.join('prisma', 'dev.db')));
    expect(spyMkdirSync).toHaveBeenCalled();
    expect(spyExecSync).toHaveBeenCalledWith('npx prisma migrate deploy', expect.any(Object));
    expect(spyExecSync).toHaveBeenCalledWith('npx prisma db seed', expect.any(Object));
    
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: 'file:' + path.resolve('./prisma/dev.db'),
          },
        },
      })
    );
  });

  it('should not run migrations/seed if database file exists in development', async () => {
    delete process.env.DATABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    
    spyExistsSync.mockReturnValue(true);
    
    const prismaModule = await import('@prisma/client');
    const MockPrismaClient = prismaModule.PrismaClient;
    
    await import('../prisma');
    
    expect(spyExistsSync).toHaveBeenCalledWith(expect.stringContaining(path.join('prisma', 'dev.db')));
    expect(spyExecSync).toHaveBeenCalledWith('npx prisma migrate deploy', expect.any(Object));
    expect(spyExecSync).not.toHaveBeenCalledWith('npx prisma db seed', expect.any(Object));
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: 'file:' + path.resolve('./prisma/dev.db'),
          },
        },
      })
    );
  });

  it('should convert relative DATABASE_URL to absolute path in development', async () => {
    process.env.DATABASE_URL = 'file:./prisma/custom.db';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    
    spyExistsSync.mockReturnValue(true);
    
    const prismaModule = await import('@prisma/client');
    const MockPrismaClient = prismaModule.PrismaClient;
    
    await import('../prisma');
    
    expect(process.env.DATABASE_URL).toBe('file:' + path.resolve('./prisma/custom.db'));
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: 'file:' + path.resolve('./prisma/custom.db'),
          },
        },
      })
    );
  });
});
