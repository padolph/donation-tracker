import { setupPassword } from '../authActions';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('authActions - setupPassword', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return error if APP_PASSWORD is already set', async () => {
    process.env.APP_PASSWORD = 'existing_password';

    const result = await setupPassword('new_password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Password is already configured.');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should return error if password is empty or blank', async () => {
    delete process.env.APP_PASSWORD;

    const result = await setupPassword('   ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Password cannot be empty.');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should save password to config.json and update process.env in production mode', async () => {
    delete process.env.APP_PASSWORD;
    process.env.CONFIG_PATH = '/mock/user/data/config.json';
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"AUTH_SECRET":"xyz"}');

    const result = await setupPassword('my_new_pass');

    expect(result.success).toBe(true);
    expect(process.env.APP_PASSWORD).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/mock/user/data/config.json',
      expect.stringMatching(/"APP_PASSWORD": "scrypt:[0-9a-f]+:[0-9a-f]+"/),
      'utf8'
    );
  });

  it('should save password to .env.local and update process.env in development mode', async () => {
    delete process.env.APP_PASSWORD;
    delete process.env.CONFIG_PATH;

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('AUTH_SECRET=xyz\nAPP_PASSWORD=old\n');

    const result = await setupPassword('my_dev_pass');

    expect(result.success).toBe(true);
    expect(process.env.APP_PASSWORD).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), '.env.local'),
      expect.stringMatching(/APP_PASSWORD=scrypt:[0-9a-f]+:[0-9a-f]+/),
      'utf8'
    );
  });

  it('should generate and save AUTH_SECRET to .env.local if AUTH_SECRET is missing in dev mode', async () => {
    delete process.env.APP_PASSWORD;
    delete process.env.AUTH_SECRET;
    delete process.env.CONFIG_PATH;

    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await setupPassword('my_dev_pass');

    expect(result.success).toBe(true);
    expect(process.env.AUTH_SECRET).toMatch(/^[0-9a-f]{64}$/);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), '.env.local'),
      expect.stringMatching(/AUTH_SECRET=[0-9a-f]{64}/),
      'utf8'
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), '.env.local'),
      expect.stringMatching(/APP_PASSWORD=scrypt:[0-9a-f]+:[0-9a-f]+/),
      'utf8'
    );
  });

  it('should generate and save AUTH_SECRET to config.json if AUTH_SECRET is missing in prod mode', async () => {
    delete process.env.APP_PASSWORD;
    delete process.env.AUTH_SECRET;
    process.env.CONFIG_PATH = '/mock/user/data/config.json';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');

    const result = await setupPassword('my_prod_pass');

    expect(result.success).toBe(true);
    expect(process.env.AUTH_SECRET).toMatch(/^[0-9a-f]{64}$/);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/mock/user/data/config.json',
      expect.stringMatching(/"AUTH_SECRET": "[0-9a-f]{64}"/),
      'utf8'
    );
  });
});
