/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Load CONFIG_PATH
const configPath = process.env.CONFIG_PATH || '/app/data/config.json';
let config = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse config file:', e);
  }
}

// 2. Ensure AUTH_SECRET exists in config.json
if (!config.AUTH_SECRET) {
  config.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Generated and persisted new AUTH_SECRET in config.json');
  } catch (e) {
    console.error('Failed to write persistent config:', e);
  }
}

// 3. Export to env
process.env.AUTH_SECRET = config.AUTH_SECRET;

// 4. Run database migrations
console.log('Running database migrations...');
try {
  execSync('node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma', { stdio: 'inherit' });
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

// 4.5 Enable SQLite Write-Ahead Logging (WAL) mode
console.log('Enabling WAL mode on SQLite database...');
try {
  const dbUrl = process.env.DATABASE_URL || 'file:/app/data/production.db';
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace(/^file:/, '').split('?')[0];
    execSync(`sqlite3 "${dbPath}" "PRAGMA journal_mode=WAL;"`, { stdio: 'inherit' });
    console.log('WAL mode enabled successfully.');
  } else {
    console.warn(`DATABASE_URL "${dbUrl}" does not start with "file:", skipping WAL mode configuration.`);
  }
} catch (error) {
  console.error('Failed to enable WAL mode:', error);
  process.exit(1);
}

// 5. Run database seed
console.log('Running database seed...');
try {
  execSync('node prisma/seed.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}

// 6. Start the Next.js standalone server
console.log('Starting Next.js standalone server...');
try {
  const { spawn } = require('child_process');
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  server.on('exit', (code) => {
    process.exit(code || 0);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
