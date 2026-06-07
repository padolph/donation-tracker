import React from 'react';

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

  it('exports metadata with the correct title "DonationTracker"', async () => {
    const layout = await import('../layout');
    expect(layout.metadata.title).toBe('DonationTracker');
  });
});
