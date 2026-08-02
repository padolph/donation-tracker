import fs from 'fs';
import path from 'path';

describe('Electron Packaging Dependencies', () => {
  it('should include "prisma" in dependencies so electron-builder includes it in production bundles', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.prisma).toBeDefined();
  });
});
