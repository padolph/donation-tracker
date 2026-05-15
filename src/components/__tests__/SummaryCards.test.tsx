import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';

interface DashboardStats {
  totalDonated: number;
  itemsTotal: number;
  cashTotal: number;
  assetsTotal: number;
  organizationCount: number;
}

describe('SummaryCards', () => {
  it('renders stats correctly', () => {
    const stats: DashboardStats = {
      totalDonated: 1700.50,
      itemsTotal: 200.00,
      cashTotal: 500.00,
      assetsTotal: 1000.50,
      organizationCount: 5,
    };
    render(<SummaryCards stats={stats} />);
    
    expect(screen.getByText('$1,700.50')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    // Cash + Assets = 1500.50
    expect(screen.getByText('$1,500.50')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
