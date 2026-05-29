import fs from 'fs';
import path from 'path';

describe('CI Workflow Configuration', () => {
  it('should set DATABASE_URL and NEXT_PHASE on Build Next.js App step', () => {
    const workflowPath = path.resolve(__dirname, '../../.github/workflows/ci.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Find the Build Next.js App step and its env block
    const stepRegex = /- name:\s*Build Next\.js App[\s\S]*?run:\s*npm run build([\s\S]*?)(?=- name:|$)/;
    const match = content.match(stepRegex);
    expect(match).not.toBeNull();

    const envBlock = match![1];
    expect(envBlock).toContain('env:');
    expect(envBlock).toContain('DATABASE_URL: "file:./prisma/empty.db"');
    expect(envBlock).toContain('NEXT_PHASE: "phase-production-build"');
  });
});
