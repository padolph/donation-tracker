import React from 'react';

// Mock next/font/google to prevent evaluation errors
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'var-geist-sans' }),
  Geist_Mono: () => ({ variable: 'var-geist-mono' }),
}));

// Mock Sidebar component
jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

describe('Root Layout Configuration', () => {
  it('exports dynamic set to force-dynamic', async () => {
    // Import layout dynamically after mocks are set up
    const layout = await import('../layout');
    expect(layout.dynamic).toBe('force-dynamic');
  });
});
