import fs from 'fs';
import path from 'path';

describe('Prisma Schema Configuration', () => {
  it('should include darwin in binaryTargets', () => {
    const schemaPath = path.resolve(__dirname, '../schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    // Parse the binaryTargets from the generator client block
    const generatorMatch = content.match(/generator\s+client\s*{[^}]*}/);
    expect(generatorMatch).not.toBeNull();
    
    const generatorBlock = generatorMatch![0];
    const binaryTargetsMatch = generatorBlock.match(/binaryTargets\s*=\s*\[([^\]]+)\]/);
    expect(binaryTargetsMatch).not.toBeNull();
    
    const binaryTargets = binaryTargetsMatch![1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));
      
    expect(binaryTargets).toContain('darwin');
  });

  it('should use env("DATABASE_URL") for the datasource url', () => {
    const schemaPath = path.resolve(__dirname, '../schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).toContain('url      = env("DATABASE_URL")');
  });
});

