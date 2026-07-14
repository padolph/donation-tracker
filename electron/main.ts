/* eslint-disable security/detect-non-literal-fs-filename */
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import net from 'net';
import fs from 'fs';
import crypto from 'crypto';
import http from 'http';

let nextServerProcess: ChildProcess | null = null;

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function runMigrations(
  unpackedPath: string,
  dbPath: string,
  env: Record<string, string | undefined>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const prismaCliPath = path.join(unpackedPath, 'node_modules/prisma/build/index.js');
    const schemaPath = path.join(unpackedPath, 'prisma/schema.prisma');

    console.log('Running database migrations...');
    const migrationProcess = fork(
      prismaCliPath,
      ['migrate', 'deploy', '--schema', schemaPath],
      {
        cwd: unpackedPath,
        env: {
          ...env,
          DATABASE_URL: 'file:' + dbPath,
        } as unknown as NodeJS.ProcessEnv,
        stdio: 'inherit',
      }
    );

    migrationProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Database migrations applied successfully.');
        resolve();
      } else {
        reject(new Error(`Migration process exited with code ${code}`));
      }
    });

    migrationProcess.on('error', (err) => {
      reject(err);
    });
  });
}

async function startNextServer(port: number) {
  const isPackaged = app.isPackaged;
  const appPath = app.getAppPath();
  const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
  
  // Point to the unpacked next binary
  const nextPath = path.join(unpackedPath, 'node_modules/next/dist/bin/next');
  
  // Unify directory resolution at the top of the function
  const userDataPath = app.getPath('userData');
  const dbName = isPackaged ? 'production.db' : 'database.db';
  const dbPath = path.join(userDataPath, dbName);
  const imageStoragePath = path.join(userDataPath, 'storage', 'donations');

  // Explicitly assign the database path to process.env.DATABASE_URL
  process.env.DATABASE_URL = 'file:' + dbPath;

  // Explicitly verify directories exist/are created structurally before config loading or forks
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.mkdirSync(imageStoragePath, { recursive: true });

  // Setup persistent AUTH_SECRET and APP_PASSWORD
  const secretPath = path.join(userDataPath, '.secret');
  const configPath = path.join(userDataPath, 'config.json');
  let authSecret = process.env.AUTH_SECRET;
  let appPassword = process.env.APP_PASSWORD;
  
  // Load persistent config if it exists
  let persistentConfig: Record<string, string> = {};
  if (fs.existsSync(configPath)) {
    try {
      persistentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse persistent config', e);
    }
  }

  // Handle APP_PASSWORD
  if (!appPassword) {
    appPassword = persistentConfig.APP_PASSWORD || persistentConfig.PASSWORD;
  } else {
    // If provided in env, hash it (if not already hashed) and update the persistent config
    if (appPassword && !appPassword.startsWith('scrypt:')) {
      appPassword = hashPassword(appPassword);
    }
    persistentConfig.APP_PASSWORD = appPassword;
    fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
  }

  // Also migrate existing persistent config password if it is plaintext
  if (persistentConfig.APP_PASSWORD && !persistentConfig.APP_PASSWORD.startsWith('scrypt:')) {
    persistentConfig.APP_PASSWORD = hashPassword(persistentConfig.APP_PASSWORD);
    appPassword = persistentConfig.APP_PASSWORD;
    delete persistentConfig.PASSWORD;
    fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
    console.log('Successfully upgraded persistent config password to secure scrypt hash.');
  } else if (persistentConfig.PASSWORD) {
    persistentConfig.APP_PASSWORD = hashPassword(persistentConfig.PASSWORD);
    appPassword = persistentConfig.APP_PASSWORD;
    delete persistentConfig.PASSWORD;
    fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
    console.log('Successfully migrated legacy password to secure scrypt hash.');
  }

  // Handle AUTH_SECRET
  if (!authSecret) {
    if (persistentConfig.AUTH_SECRET) {
      authSecret = persistentConfig.AUTH_SECRET;
    } else if (fs.existsSync(secretPath)) {
      // Legacy support for the .secret file I created earlier
      const legacySecret = fs.readFileSync(secretPath, 'utf8');
      authSecret = legacySecret;
      persistentConfig.AUTH_SECRET = legacySecret;
      fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
    } else {
      const generatedSecret = crypto.randomBytes(32).toString('hex');
      authSecret = generatedSecret;
      persistentConfig.AUTH_SECRET = generatedSecret;
      fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
    }
  }
  
  // Copy default db if it doesn't exist
  if (isPackaged && !fs.existsSync(dbPath)) {
    const defaultDbPath = path.join(unpackedPath, 'prisma/production.db');
    if (fs.existsSync(defaultDbPath)) {
      fs.copyFileSync(defaultDbPath, dbPath);
      // Ensure the file is writable
      fs.chmodSync(dbPath, 0o666);
    }
  }

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: 'file:' + dbPath,
    AUTH_TRUST_HOST: 'true',
    AUTH_URL: `http://localhost:${port}`,
    AUTH_SECRET: authSecret || 'fallback-secret',
    APP_PASSWORD: appPassword || '',
    IMAGE_STORAGE_PATH: imageStoragePath,
    CONFIG_PATH: configPath,
  };

  if (isPackaged) {
    try {
      await runMigrations(unpackedPath, dbPath, env);
    } catch (error) {
      console.error('Failed to run database migrations:', error);
      throw error;
    }
  }

  nextServerProcess = fork(nextPath, ['start', '-p', port.toString()], {
    cwd: unpackedPath,
    env: env as NodeJS.ProcessEnv,
    stdio: 'inherit',
  });

  return new Promise<void>((resolve) => {
    const checkServer = () => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000,
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', () => {
        setTimeout(checkServer, 500);
      });

      req.on('timeout', () => {
        req.destroy();
        setTimeout(checkServer, 500);
      });

      req.end();
    };
    checkServer();
  });
}

async function createWindow() {
  let port = Number(process.env.PORT) || 3000;

  if (app.isPackaged) {
    port = await getFreePort();
    await startNextServer(port);
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: process.platform === 'linux',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadApp = () => {
    win.loadURL(`http://localhost:${port}`).catch(() => {
      console.log(`Next.js server not ready on port ${port}, retrying in 1s...`);
      setTimeout(loadApp, 1000);
    });
  };

  loadApp();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }
});
