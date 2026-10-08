#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename -- plain Node build script; paths come from the repo root */
// Creates and seeds prisma/production.db, the default database that
// electron-builder packages and the desktop app copies on first launch.
// Plain Node instead of shell syntax so `npm run desktop:build` works the
// same on macOS, Linux and Windows (cmd.exe has no `VAR=x cmd` or `$(pwd)`).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function productionDbPath(root) {
  return path.resolve(root, 'prisma', 'production.db');
}

// Prisma accepts absolute file: URLs with forward slashes on every platform.
function toDatabaseUrl(dbPath) {
  return 'file:' + dbPath.replace(/\\/g, '/');
}

function runPrisma(args, opts) {
  const cli = require.resolve('prisma/build/index.js', { paths: [opts.cwd] });
  execFileSync(process.execPath, [cli, ...args], { stdio: 'inherit', ...opts });
}

function prepareDesktopDb({ root = process.cwd(), run = runPrisma } = {}) {
  const dbPath = productionDbPath(root);

  // Start fresh so a database left over from a local run is never packaged.
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    fs.rmSync(dbPath + suffix, { force: true });
  }

  const env = { ...process.env, DATABASE_URL: toDatabaseUrl(dbPath) };
  run(['migrate', 'deploy'], { cwd: root, env });
  run(['db', 'seed'], { cwd: root, env });

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Expected the seeded database at ${dbPath}, but it was not created.`);
  }
  return dbPath;
}

module.exports = { productionDbPath, toDatabaseUrl, prepareDesktopDb };

if (require.main === module) {
  const dbPath = prepareDesktopDb();
  console.log(`Desktop database ready: ${dbPath}`);
}
