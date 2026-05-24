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
});
