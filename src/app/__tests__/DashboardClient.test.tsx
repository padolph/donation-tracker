import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardClient from '../DashboardClient';
import { getDashboardStats } from '@/app/actions/dashboardActions';

// Mock the server action
jest.mock('@/app/actions/dashboardActions', () => ({
  getDashboardStats: jest.fn(),
}));

const mockStats = {
  totalDonated: 1000,
  itemsTotal: 500,
  cashTotal: 300,
  assetsTotal: 200,
  organizationCount: 3,
  taxSavings: 320,
  marginalTaxRate: 0.32,
};

describe('DashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial stats', () => {
    render(<DashboardClient initialStats={mockStats} />);
    // Check Total Donated card
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    // Check Organization count card
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('updates stats when year changes', async () => {
    const newStats = { ...mockStats, totalDonated: 2000, taxSavings: 640 };
    (getDashboardStats as jest.Mock).mockResolvedValue({ success: true, stats: newStats });
    
    render(<DashboardClient initialStats={mockStats} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2025' } });
    
    await waitFor(() => {
      expect(getDashboardStats).toHaveBeenCalledWith(2025);
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });
  });
});
