/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
jest.mock('electron', () => {
  const mockLoadURL = jest.fn().mockResolvedValue(undefined);
  const mockOn = jest.fn();

  const mockBrowserWindow = jest.fn().mockImplementation(() => {
    return {
      loadURL: mockLoadURL,
      on: mockOn,
    };
  });

  (mockBrowserWindow as any).getAllWindows = jest.fn().mockReturnValue([]);

  const mockApp = {
    isPackaged: false,
    getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
    getPath: jest.fn().mockReturnValue('/mock/user/data'),
    whenReady: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    on: mockOn,
    quit: jest.fn(),
  };

  return {
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
  };
});

jest.mock('child_process', () => {
  const mockProcess = {
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'exit') {
        setTimeout(() => callback(0), 0);
      }
      return mockProcess;
    }),
    kill: jest.fn(),
  };
  return {
    fork: jest.fn().mockReturnValue(mockProcess),
  };
});

jest.mock('net', () => {
  const originalNet = jest.requireActual('net');
  return {
    ...originalNet,
    createServer: jest.fn().mockImplementation(() => {
      return {
        unref: jest.fn(),
        on: jest.fn(),
        listen: jest.fn().mockImplementation((port, cb) => {
          if (cb) cb();
        }),
        close: jest.fn().mockImplementation((cb) => {
          if (cb) cb();
        }),
        address: jest.fn().mockReturnValue({ port: 3000 }),
      };
    }),
    createConnection: jest.fn().mockImplementation((options, callback) => {
      if (typeof callback === 'function') {
        setTimeout(callback, 0);
      }
      return {
        on: jest.fn(),
        end: jest.fn(),
      };
    }),
  };
});

jest.mock('http', () => {
  const mockRequest = {
    on: jest.fn().mockReturnThis(),
    end: jest.fn(),
    destroy: jest.fn(),
  };
  return {
    request: jest.fn().mockImplementation((options, callback) => {
      const mockResponse = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'end') {
            setTimeout(handler, 0);
          }
          return mockResponse;
        }),
      };
      if (callback) {
        setTimeout(() => callback(mockResponse), 0);
      }
      return mockRequest;
    }),
  };
});

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    mkdirSync: jest.fn(),
    existsSync: jest.fn().mockImplementation((p) => {
      if (typeof p === 'string' && (p.endsWith('production.db') || p.endsWith('database.db'))) {
        return false;
      }
      return true;
    }),
    readFileSync: jest.fn().mockReturnValue('{}'),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    chmodSync: jest.fn(),
  };
});

describe('Electron Main Process', () => {
  let originalPlatform: string;

  beforeAll(() => {
    originalPlatform = process.platform;
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should enable autoHideMenuBar on linux platform', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });

    require('../main');

    // Wait for the ready promise to resolve and createWindow to be called
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { BrowserWindow } = require('electron');
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        autoHideMenuBar: true,
      })
    );
  });

  it('should not enable autoHideMenuBar on non-linux platforms (e.g., darwin)', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });

    require('../main');

    // Wait for the ready promise to resolve and createWindow to be called
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { BrowserWindow } = require('electron');
    // It should either be undefined or false, but definitely not true
    const callArgs = BrowserWindow.mock.calls[0][0];
    expect(callArgs.autoHideMenuBar).not.toBe(true);
  });

  it('should initialize paths, verify directory creation, and fork process with correct env in packaged production mode', async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const { app } = require('electron');
    // Set isPackaged to true
    app.isPackaged = true;

    // Spy/mock fs methods
    const fs = require('fs');
    fs.mkdirSync.mockClear();
    
    const child_process = require('child_process');
    child_process.fork.mockClear();

    require('../main');

    // Wait for async initialization
    await new Promise((resolve) => setTimeout(resolve, 200));

    const path = require('path');
    // Verify fs.mkdirSync was called for userDataPath and IMAGE_STORAGE_PATH
    // userDataPath is '/mock/user/data'
    // IMAGE_STORAGE_PATH is '/mock/user/data/storage/donations'
    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/user/data', { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/mock/user/data', 'storage', 'donations'), { recursive: true });

    // Verify child_process.fork is called with correct DATABASE_URL and IMAGE_STORAGE_PATH in env
    expect(child_process.fork).toHaveBeenCalledTimes(2);

    // 1st fork call: database migrations
    const migrationForkArgs = child_process.fork.mock.calls[0];
    expect(migrationForkArgs[0]).toBe(path.join('/mock/app/path', 'node_modules/prisma/build/index.js'));
    expect(migrationForkArgs[1]).toEqual([
      'migrate',
      'deploy',
      '--schema',
      path.join('/mock/app/path', 'prisma/schema.prisma')
    ]);
    const migrationEnv = migrationForkArgs[2].env;
    expect(migrationEnv.DATABASE_URL).toBe('file:' + path.join('/mock/user/data', 'production.db'));

    // 2nd fork call: Next.js server
    const serverForkArgs = child_process.fork.mock.calls[1];
    expect(serverForkArgs[0]).toBe(path.join('/mock/app/path', 'node_modules/next/dist/bin/next'));
    expect(serverForkArgs[1]).toEqual(['start', '-p', '3000']);
    const serverEnv = serverForkArgs[2].env;
    expect(serverEnv.DATABASE_URL).toBe('file:' + path.join('/mock/user/data', 'production.db'));
    expect(serverEnv.IMAGE_STORAGE_PATH).toBe(path.join('/mock/user/data', 'storage', 'donations'));
    
    // Verify that process.env.DATABASE_URL itself was explicitly assigned in the main process
    expect(process.env.DATABASE_URL).toBe('file:' + path.join('/mock/user/data', 'production.db'));

    // Clean up
    app.isPackaged = false;
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should verify the server check makes an HTTP GET request to localhost on startup', async () => {
    const { app } = require('electron');
    app.isPackaged = true;

    const http = require('http');
    http.request.mockClear();

    require('../main');

    // Wait for the ready promise to resolve and checkServer/http.request to be called
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'localhost',
        path: '/',
        method: 'GET',
      }),
      expect.any(Function)
    );

    // Clean up
    app.isPackaged = false;
  });
});
