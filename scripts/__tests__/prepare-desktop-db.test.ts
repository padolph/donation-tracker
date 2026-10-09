/**
 * @jest-environment node
 */
/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import os from 'os';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { productionDbPath, toDatabaseUrl, prepareDesktopDb } = require('../prepare-desktop-db');

describe('prepare-desktop-db', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-db-'));
    fs.mkdirSync(path.join(root, 'prisma'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('resolves the database to an absolute path inside prisma/', () => {
    expect(productionDbPath(root)).toBe(path.join(root, 'prisma', 'production.db'));
    expect(path.isAbsolute(productionDbPath(root))).toBe(true);
  });

  it('builds a file: URL with forward slashes so Windows paths work', () => {
    expect(toDatabaseUrl('C:\\work\\app\\prisma\\production.db')).toBe('file:C:/work/app/prisma/production.db');
    expect(toDatabaseUrl('/work/app/prisma/production.db')).toBe('file:/work/app/prisma/production.db');
  });

  it('runs migrate deploy then db seed against the absolute production database', () => {
    const dbPath = path.join(root, 'prisma', 'production.db');
    const calls: { args: string[]; cwd: string; url: string | undefined }[] = [];
    const run = (args: string[], opts: { cwd: string; env: NodeJS.ProcessEnv }) => {
      calls.push({ args, cwd: opts.cwd, url: opts.env.DATABASE_URL });
      fs.writeFileSync(dbPath, '');
    };

    expect(prepareDesktopDb({ root, run })).toBe(dbPath);

    expect(calls.map((c) => c.args)).toEqual([['migrate', 'deploy'], ['db', 'seed']]);
    for (const call of calls) {
      expect(call.cwd).toBe(root);
      expect(call.url).toBe(toDatabaseUrl(dbPath));
      expect(call.url).not.toContain('$(pwd)');
    }
  });

  it('starts from a fresh database so a stale local copy is never packaged', () => {
    const dbPath = path.join(root, 'prisma', 'production.db');
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      fs.writeFileSync(dbPath + suffix, 'stale');
    }
    const seen: boolean[] = [];
    const run = () => {
      seen.push(fs.existsSync(dbPath) || fs.existsSync(dbPath + '-wal'));
      fs.writeFileSync(dbPath, 'fresh');
    };

    prepareDesktopDb({ root, run });

    expect(seen[0]).toBe(false);
    expect(fs.readFileSync(dbPath, 'utf8')).toBe('fresh');
  });

  it('fails loudly if the database was not created where expected', () => {
    expect(() => prepareDesktopDb({ root, run: () => {} })).toThrow(/production\.db/);
  });
});

describe('desktop build wiring', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  it('desktop:build prepares the database with the cross-platform script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const script: string = pkg.scripts['desktop:build'];
    expect(script).toContain('node scripts/prepare-desktop-db.js');
    expect(script).not.toContain('$(pwd)');
    expect(script).not.toMatch(/DATABASE_URL=/);
  });

  it('CI seeds the packaged database with the same script', () => {
    const ci = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('node scripts/prepare-desktop-db.js');
  });
});
