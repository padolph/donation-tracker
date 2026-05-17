import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('renders all required navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('All Donations')).toBeInTheDocument();
    expect(screen.getByText('Add Donation')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Tax Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights the active link correctly', () => {
    (usePathname as jest.Mock).mockReturnValue('/donations');
    render(<Sidebar />);
    
    const allDonationsLink = screen.getByText('All Donations').closest('a');
    expect(allDonationsLink).toHaveClass('bg-white/10');
  });
});