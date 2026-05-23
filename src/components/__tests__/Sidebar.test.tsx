import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
    jest.clearAllMocks();
  });

  it('renders all required navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('All Donations')).toBeInTheDocument();
    expect(screen.getByText('Add Donation')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Tax Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('renders the custom logo image instead of the generic heart character', () => {
    render(<Sidebar />);
    const logoImg = screen.getByAltText('DonationTrack Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/icon.png');
    expect(screen.queryByText('♡')).not.toBeInTheDocument();
  });

  it('highlights the active link correctly', () => {
    (usePathname as jest.Mock).mockReturnValue('/donations');
    render(<Sidebar />);
    
    const allDonationsLink = screen.getByText('All Donations').closest('a');
    expect(allDonationsLink).toHaveClass('bg-white/10');
  });

  it('calls signOut when the Sign Out button is clicked', () => {
    render(<Sidebar />);
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    expect(signOut).toHaveBeenCalled();
  });
});