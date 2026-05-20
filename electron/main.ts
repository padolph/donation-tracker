import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import net from 'net';
import fs from 'fs';

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

async function startNextServer(port: number) {
  const isPackaged = app.isPackaged;
  const appPath = app.getAppPath();
  const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
  
  // Point to the unpacked next binary
  const nextPath = path.join(unpackedPath, 'node_modules/next/dist/bin/next');
  
  // Setup writable database path in userData
  const userDataPath = app.getPath('userData');
  const dbPath = isPackaged 
    ? path.join(userDataPath, 'production.db')
    : path.join(userDataPath, 'database.db');
  
  // Setup persistent AUTH_SECRET and APP_PASSWORD
  const secretPath = path.join(userDataPath, '.secret');
  const configPath = path.join(userDataPath, 'config.json');
  let authSecret = process.env.AUTH_SECRET;
  let appPassword = process.env.APP_PASSWORD || process.env.PASSWORD;
  
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
    // If provided in env, update the persistent config
    persistentConfig.APP_PASSWORD = appPassword;
    fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
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
      const generatedSecret = require('crypto').randomBytes(32).toString('hex');
      authSecret = generatedSecret;
      persistentConfig.AUTH_SECRET = generatedSecret;
      fs.writeFileSync(configPath, JSON.stringify(persistentConfig), 'utf8');
    }
  }
  
  // Copy default db if it doesn't exist
  if (isPackaged && !fs.existsSync(dbPath)) {
    const defaultDbPath = path.join(unpackedPath, 'prisma/dev.db');
    if (fs.existsSync(defaultDbPath)) {
      fs.copyFileSync(defaultDbPath, dbPath);
      // Ensure the file is writable
      fs.chmodSync(dbPath, 0o666);
    }
  }

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: isPackaged 
      ? `file:${path.join(app.getPath('userData'), 'production.db')}` 
      : `file:${dbPath}`,
    AUTH_TRUST_HOST: 'true',
    AUTH_URL: `http://localhost:${port}`,
    AUTH_SECRET: authSecret || 'fallback-secret',
    APP_PASSWORD: appPassword || '',
  };

  nextServerProcess = fork(nextPath, ['start', '-p', port.toString()], {
    cwd: unpackedPath,
    env: env as any,
    stdio: 'inherit',
  });

  return new Promise<void>((resolve) => {
    const checkServer = () => {
      const client = net.createConnection({ port }, () => {
        client.end();
        resolve();
      });
      client.on('error', () => {
        setTimeout(checkServer, 500);
      });
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
