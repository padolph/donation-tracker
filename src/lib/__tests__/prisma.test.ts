import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// We mock the PrismaClient class to capture constructor arguments
jest.mock('@prisma/client', () => {
  const mPrismaClient = jest.fn().mockImplementation(() => ({}));
  return { PrismaClient: mPrismaClient };
});

describe('Prisma Client Initialization', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete (global as any).prisma;
    process.env = { ...originalEnv };
  });

  it('should pass datasources override if process.env.DATABASE_URL is set', () => {
    process.env.DATABASE_URL = 'file:/tmp/test.db';
    
    // Import the mock client to assert on it
    const { PrismaClient: MockPrismaClient } = require('@prisma/client');
    
    // Require the prisma.ts file to trigger instantiation
    require('../prisma');
    
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

  it('should not pass datasources override if process.env.DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;
    
    const { PrismaClient: MockPrismaClient } = require('@prisma/client');
    
    require('../prisma');
    
    expect(MockPrismaClient).toHaveBeenCalledWith(
      expect.not.objectContaining({
        datasources: expect.any(Object),
      })
    );
  });
});
