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
  return {
    fork: jest.fn().mockReturnValue({
      on: jest.fn(),
      kill: jest.fn(),
    }),
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
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify fs.mkdirSync was called for userDataPath and IMAGE_STORAGE_PATH
    // userDataPath is '/mock/user/data'
    // IMAGE_STORAGE_PATH is '/mock/user/data/storage/donations'
    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/user/data', { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/user/data/storage/donations', { recursive: true });

    // Verify child_process.fork is called with correct DATABASE_URL and IMAGE_STORAGE_PATH in env
    expect(child_process.fork).toHaveBeenCalled();
    const forkArgs = child_process.fork.mock.calls[0];
    const forkEnv = forkArgs[2].env;

    expect(forkEnv.DATABASE_URL).toBe('file:/mock/user/data/production.db');
    expect(forkEnv.IMAGE_STORAGE_PATH).toBe('/mock/user/data/storage/donations');
    
    // Clean up
    app.isPackaged = false;
  });
});
