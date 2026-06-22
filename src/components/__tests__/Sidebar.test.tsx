const originalMessageChannel = global.MessageChannel;

import { render, screen, fireEvent, act } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { version } from '../../../package.json';

jest.mock('@testing-library/react', () => {
  // Mock MessageChannel before actual @testing-library/react and scheduler are required
  // @ts-expect-error - overriding global MessageChannel
  global.MessageChannel = class MockMessageChannel {
    port1: { postMessage: (msg: unknown) => void; onmessage: ((ev: { data: unknown }) => void) | null; close: () => void };
    port2: { postMessage: (msg: unknown) => void; onmessage: ((ev: { data: unknown }) => void) | null; close: () => void };
    constructor() {
      this.port1 = {
        postMessage: (msg: unknown) => {
          setTimeout(() => {
            if (this.port2.onmessage) {
              this.port2.onmessage({ data: msg });
            }
          }, 0);
        },
        onmessage: null,
        close: () => {},
      };
      this.port2 = {
        postMessage: (msg: unknown) => {
          setTimeout(() => {
            if (this.port1.onmessage) {
              this.port1.onmessage({ data: msg });
            }
          }, 0);
        },
        onmessage: null,
        close: () => {},
      };
    }
  };

  return jest.requireActual('@testing-library/react');
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

afterAll(() => {
  global.MessageChannel = originalMessageChannel;
});

describe('Sidebar', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
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
    const logoImg = screen.getByAltText('DonationTracker Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/icon.png');
    expect(screen.queryByText('♡')).not.toBeInTheDocument();
  });

  it('retries loading the logo image with a query parameter on error up to 10 times', () => {
    jest.useFakeTimers();
    render(<Sidebar />);
    const logoImg = screen.getByAltText('DonationTracker Logo');
    
    expect(logoImg).toHaveAttribute('src', '/icon.png');
    
    // Simulate 10 error events and fast-forward timers
    for (let i = 1; i <= 10; i++) {
      fireEvent.error(logoImg);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(logoImg.getAttribute('src')).toMatch(new RegExp(`^\\/icon\\.png\\?retry=${i}&t=\\d+`));
    }
    
    // The 11th error event should NOT trigger another retry (since it is capped at 10)
    const lastSrc = logoImg.getAttribute('src');
    fireEvent.error(logoImg);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(logoImg.getAttribute('src')).toBe(lastSrc);
  });

  it('renders the application brand name DonationTracker', () => {
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'DonationTracker' })).toBeInTheDocument();
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

  it('renders the application version from package.json', () => {
    render(<Sidebar />);
    expect(screen.getByText(`v${version}`)).toBeInTheDocument();
  });

  it('renders the mobile menu toggle button and opens/closes the mobile menu drawer', () => {
    render(<Sidebar />);
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();

    // The container that wraps the navigation links has the class 'hidden' by default
    // We target the ancestor element with the layout class names
    const dashboardLink = screen.getByText('Dashboard');
    const navContainer = dashboardLink.closest('div')?.parentElement;
    expect(navContainer).toHaveClass('hidden');

    // Click toggle button to open the mobile menu
    fireEvent.click(toggleButton);

    // The container should now have the class 'fixed' and NOT 'hidden'
    expect(navContainer).toHaveClass('fixed');
    expect(navContainer).not.toHaveClass('hidden');

    // Click a navigation link in the mobile drawer
    fireEvent.click(dashboardLink);

    // Clicking the link should close the mobile drawer (container has 'hidden' class again)
    expect(navContainer).toHaveClass('hidden');
    expect(navContainer).not.toHaveClass('fixed');
  });
});