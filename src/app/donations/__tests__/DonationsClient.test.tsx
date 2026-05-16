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
    photos: [{ filePath: '/storage/receipt.jpg' }, { filePath: '/storage/doc.pdf' }],
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
    const thumbnail = screen.getByRole('img', { name: /Attachment 1/i });
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', '/api/photos/receipt.jpg');
  });

  it('opens the image overlay when a thumbnail is clicked', async () => {
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockDonations });

    await act(async () => {
      render(<DonationsClient initialDonations={mockDonations} organizations={mockOrganizations} />);
    });

    // Expand second row
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    await act(async () => {
      fireEvent.click(expandButtons[1]);
    });

    // Click thumbnail
    const thumbnailButton = screen.getByRole('button', { name: /view image/i });
    await act(async () => {
      fireEvent.click(thumbnailButton);
    });

    // Overlay should be visible
    expect(screen.getByLabelText(/close overlay/i)).toBeInTheDocument();
    const images = screen.getAllByRole('img', { name: /Attachment 1/i });
    expect(images).toHaveLength(2); // One thumbnail, one overlay
    expect(images.find(img => img.classList.contains('object-contain'))).toBeInTheDocument();

    // Close overlay
    const closeButton = screen.getByLabelText(/close overlay/i);
    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Overlay should be gone
    expect(screen.queryByLabelText(/close overlay/i)).not.toBeInTheDocument();
  });

  it('opens the image overlay with an iframe when a PDF thumbnail is clicked', async () => {
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockDonations });

    await act(async () => {
      render(<DonationsClient initialDonations={mockDonations} organizations={mockOrganizations} />);
    });

    // Expand second row
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    await act(async () => {
      fireEvent.click(expandButtons[1]);
    });

    // Click PDF thumbnail
    const pdfButton = screen.getByRole('button', { name: /view pdf/i });
    await act(async () => {
      fireEvent.click(pdfButton);
    });

    // Overlay should show iframe for PDF
    expect(screen.getByTitle(/Attachment 2/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Attachment 2/i).tagName).toBe('IFRAME');
  });

  it('correctly calculates total value for ASSET donations', async () => {
    const mockAssetDonations = [
      {
        id: 3,
        date: new Date('2026-05-15T10:00:00Z'),
        organizationId: 1,
        type: 'ASSETS',
        cashAmount: 500.25,
        assetTicker: 'AAPL',
        assetShares: 2.5,
        organization: { id: 1, name: 'Goodwill' },
        items: [],
        photos: [],
      },
    ];

    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockAssetDonations });

    await act(async () => {
      render(<DonationsClient initialDonations={mockAssetDonations as never} organizations={mockOrganizations} />);
    });

    expect(screen.getByRole('cell', { name: '$500.25' })).toBeInTheDocument();
  });
});