/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define the mock functions outside so we can access them in assertions
const mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
const mockSpawn = jest.fn().mockImplementation(() => {
  const emitter = {
    on: jest.fn((event: string, callback: (...args: any[]) => void) => {
      if (event === 'exit') {
        callback(0);
      }
      return emitter;
    })
  };
  return emitter;
});

const mockExistsSync = jest.fn().mockReturnValue(false);
const mockReadFileSync = jest.fn().mockReturnValue('{}');
const mockWriteFileSync = jest.fn().mockReturnValue(undefined);
const mockMkdirSync = jest.fn().mockReturnValue(undefined);

// Mock the modules using jest.mock
jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process') as any;
  return {
    ...actual,
    execSync: mockExecSync,
    spawn: mockSpawn
  };
});

jest.mock('fs', () => {
  const actual = jest.requireActual('fs') as any;
  return {
    ...actual,
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync
  };
});

describe('entrypoint.js script execution', () => {
  let spyProcessExit: jest.SpiedFunction<typeof process.exit>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    
    spyProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    }) as any;

    mockExecSync.mockClear();
    mockSpawn.mockClear();
    mockExistsSync.mockClear();
    mockReadFileSync.mockClear();
    mockWriteFileSync.mockClear();
    mockMkdirSync.mockClear();
  });

  afterEach(() => {
    spyProcessExit.mockRestore();
    jest.restoreAllMocks();
  });

  it('should run migrations, enable WAL mode if DATABASE_URL is set, run seed, and spawn Next.js server', () => {
    process.env.DATABASE_URL = 'file:/app/data/production.db?connection_limit=1&socket_timeout=5000&busy_timeout=5000';
    process.env.CONFIG_PATH = '/app/data/config.json';
    mockExistsSync.mockReturnValue(true);

    try {
      require('../../entrypoint.js');
    } catch (e: any) {
      if (e.message !== 'process.exit called') {
        throw e;
      }
    }

    // Verify migrations were run
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate deploy'),
      expect.any(Object)
    );

    // Verify WAL mode was enabled on the database file path extracted from DATABASE_URL
    expect(mockExecSync).toHaveBeenCalledWith(
      'sqlite3 "/app/data/production.db" "PRAGMA journal_mode=WAL;"',
      expect.any(Object)
    );

    // Verify database seed was run
    expect(mockExecSync).toHaveBeenCalledWith(
      'node prisma/seed.js',
      expect.any(Object)
    );

    // Verify Next.js server was spawned
    expect(mockSpawn).toHaveBeenCalledWith(
      'node',
      ['server.js'],
      expect.any(Object)
    );
  });

  it('should handle custom database URLs gracefully and parse file path properly', () => {
    process.env.DATABASE_URL = 'file:./relative/custom-db.sqlite?connection_limit=1';
    process.env.CONFIG_PATH = '/app/data/config.json';
    mockExistsSync.mockReturnValue(true);

    try {
      require('../../entrypoint.js');
    } catch (e: any) {
      if (e.message !== 'process.exit called') {
        throw e;
      }
    }

    expect(mockExecSync).toHaveBeenCalledWith(
      'sqlite3 "./relative/custom-db.sqlite" "PRAGMA journal_mode=WAL;"',
      expect.any(Object)
    );
  });

  it('should skip WAL configuration if DATABASE_URL is not set or does not start with file:', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/db';
    process.env.CONFIG_PATH = '/app/data/config.json';
    mockExistsSync.mockReturnValue(true);

    try {
      require('../../entrypoint.js');
    } catch (e: any) {
      if (e.message !== 'process.exit called') {
        throw e;
      }
    }

    // Migration and seed should still run, but sqlite3 journal_mode=WAL should NOT be called
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('migrate deploy'),
      expect.any(Object)
    );
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('PRAGMA journal_mode=WAL;'),
      expect.any(Object)
    );
  });
});
