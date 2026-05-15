import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DonationsClient from '../DonationsClient';
import { getDonations } from '@/app/actions/donationActions';

// Mock the server action
jest.mock('@/app/actions/donationActions', () => ({
  getDonations: jest.fn(),
}));

const mockOrganizations = [
  { id: 1, name: 'Goodwill' },
  { id: 2, name: 'Salvation Army' },
];

const mockDonations = [
  {
    id: 1,
    date: new Date('2026-05-12T10:00:00Z'),
    organizationId: 1,
    type: 'ITEMS',
    cashAmount: null,
    assetTicker: null,
    assetShares: null,
    organization: { id: 1, name: 'Goodwill' },
    items: [
      { id: 10, quantity: 2, condition: 'High', lockedValue: 50, item: { description: 'Shirt' } },
    ],
    photos: [],
  },
  {
    id: 2,
    date: new Date('2025-12-25T10:00:00Z'),
    organizationId: 2,
    type: 'CASH',
    cashAmount: 1500,
    assetTicker: null,
    assetShares: null,
    organization: { id: 2, name: 'Salvation Army' },
    items: [],
    photos: [{ filePath: '/storage/receipt.jpg' }],
  },
];

describe('DonationsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial donations list and calculates total value', async () => {
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockDonations });

    await act(async () => {
      render(<DonationsClient initialDonations={mockDonations} organizations={mockOrganizations} />);
    });

    // Should render headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();

    // Should render data rows
    expect(screen.getByRole('cell', { name: 'Goodwill' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Salvation Army' })).toBeInTheDocument();

    // Total value calculations: 2 * 50 = $100 for items, $1,500 for cash
    expect(screen.getByRole('cell', { name: '$100.00' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '$1,500.00' })).toBeInTheDocument();
  });

  it('filters data when year or organization is changed', async () => {
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: [mockDonations[1]] });

    await act(async () => {
      render(<DonationsClient initialDonations={mockDonations} organizations={mockOrganizations} />);
    });

    // Change year
    const yearSelect = screen.getByLabelText('Filter by Year');
    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2025' } });
    });

    await waitFor(() => {
      expect(getDonations).toHaveBeenCalledWith({ year: 2025, organizationId: undefined });
    });

    // Change organization
    const orgSelect = screen.getByLabelText('Filter by Organization');
    await act(async () => {
      fireEvent.change(orgSelect, { target: { value: '2' } });
    });

    await waitFor(() => {
      expect(getDonations).toHaveBeenCalledWith({ year: 2025, organizationId: 2 });
    });
  });

  it('expands a row to show detailed line items and photos', async () => {
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockDonations });

    await act(async () => {
      render(<DonationsClient initialDonations={mockDonations} organizations={mockOrganizations} />);
    });

    // Expand first row
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    await act(async () => {
      fireEvent.click(expandButtons[0]);
    });

    // Should show line items for the first donation
    expect(screen.getByText(/Shirt/)).toBeInTheDocument();
    expect(screen.getByText(/Qty: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Condition: High/)).toBeInTheDocument();

    // Expand second row
    await act(async () => {
      fireEvent.click(expandButtons[1]);
    });

    // Should show photo for second donation
    expect(screen.getByText(/\/storage\/receipt\.jpg/)).toBeInTheDocument();
  });
});