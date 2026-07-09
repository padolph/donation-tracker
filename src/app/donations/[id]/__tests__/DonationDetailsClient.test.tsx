import { render, screen, fireEvent, act } from '@testing-library/react';
import DonationDetailsClient from '../DonationDetailsClient';
import { DonationEvent } from '../../DonationsClient';

const mockItemsDonation: DonationEvent = {
  id: 1,
  date: '2026-05-12T00:00:00.000Z',
  organizationId: 1,
  type: 'ITEMS',
  cashAmount: null,
  assetTicker: null,
  assetShares: null,
  notes: 'These are test notes for the donation.',
  organization: { id: 1, name: 'Goodwill' },
  items: [
    { id: 10, quantity: 2, condition: 'High', lockedValue: 50, item: { id: 100, description: 'Shirt' } },
    { id: 11, quantity: 1, condition: 'Medium', lockedValue: 20, item: { id: 101, description: 'Pants' } },
  ],
  photos: [
    { filePath: '/storage/receipt.jpg' },
    { filePath: '/storage/doc.pdf' },
  ],
};

const mockCashDonation: DonationEvent = {
  id: 2,
  date: '2026-05-13T10:00:00.000Z',
  organizationId: 2,
  type: 'CASH',
  cashAmount: 1500,
  assetTicker: null,
  assetShares: null,
  notes: null,
  organization: { id: 2, name: 'Salvation Army' },
  items: [],
  photos: [],
};

const mockAssetDonation: DonationEvent = {
  id: 3,
  date: '2026-05-14T10:00:00.000Z',
  organizationId: 1,
  type: 'ASSETS',
  cashAmount: 500.25,
  assetTicker: 'AAPL',
  assetShares: 2.5,
  notes: 'Stock donation',
  organization: { id: 1, name: 'Goodwill' },
  items: [],
  photos: [],
};

describe('DonationDetailsClient', () => {
  it('renders items donation details correctly with scrollable items list', () => {
    render(<DonationDetailsClient donation={mockItemsDonation} />);

    // Check headers and metadata
    expect(screen.getByText('Donation Details')).toBeInTheDocument();
    expect(screen.getByText('Goodwill')).toBeInTheDocument();
    expect(screen.getByText('ITEMS')).toBeInTheDocument();
    expect(screen.getByText('These are test notes for the donation.')).toBeInTheDocument();
    expect(screen.getByText(/Date: 5\/12\/2026/)).toBeInTheDocument();

    // Check items table content
    expect(screen.getByText('Shirt')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    expect(screen.getByText('Pants')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getAllByText('$20.00')).toHaveLength(2); // Unit value and Total value

    // Total should be 2 * 50 + 1 * 20 = $120
    expect(screen.getByText('Total Value:')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();

    // Edit and Back buttons
    const editLink = screen.getByRole('link', { name: /edit donation/i });
    expect(editLink).toHaveAttribute('href', '/donations/1/edit');

    const backLink = screen.getByRole('link', { name: /back to ledger/i });
    expect(backLink).toHaveAttribute('href', '/donations');
  });

  it('renders cash donation details correctly', () => {
    render(<DonationDetailsClient donation={mockCashDonation} />);

    expect(screen.getByText('Salvation Army')).toBeInTheDocument();
    expect(screen.getByText('CASH')).toBeInTheDocument();
    expect(screen.getAllByText('$1,500.00')).toHaveLength(2); // Contribution and Total Value
  });

  it('renders asset donation details correctly', () => {
    render(<DonationDetailsClient donation={mockAssetDonation} />);

    expect(screen.getByText('Goodwill')).toBeInTheDocument();
    expect(screen.getByText('ASSETS')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Shares: 2.5')).toBeInTheDocument();
    expect(screen.getAllByText('$500.25')).toHaveLength(2); // Asset Details and Total Value
  });

  it('opens and closes image overlay when attachments are clicked', async () => {
    render(<DonationDetailsClient donation={mockItemsDonation} />);

    // Click image thumbnail
    const imageButton = screen.getByRole('button', { name: /view image/i });
    await act(async () => {
      fireEvent.click(imageButton);
    });

    // Verify overlay is open
    expect(screen.getByLabelText(/close overlay/i)).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByLabelText(/close overlay/i);
    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Verify overlay is closed
    expect(screen.queryByLabelText(/close overlay/i)).not.toBeInTheDocument();
  });

  it('opens PDF viewer overlay when PDF thumbnail is clicked', async () => {
    render(<DonationDetailsClient donation={mockItemsDonation} />);

    // Click PDF thumbnail button
    const pdfButton = screen.getByRole('button', { name: /view pdf/i });
    await act(async () => {
      fireEvent.click(pdfButton);
    });

    // Verify iframe for PDF is displayed
    expect(screen.getByTitle(/Attachment 2/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Attachment 2/i).tagName).toBe('IFRAME');
  });

  it('renders Mileage details card when donation type is MILEAGE', () => {
    const mockMileageDonation: DonationEvent = {
      id: 4,
      date: '2026-05-16T00:00:00.000Z',
      organizationId: 1,
      type: 'MILEAGE',
      cashAmount: 24.00,
      assetTicker: null,
      assetShares: null,
      notes: 'Volunteer trip',
      organization: { id: 1, name: 'Goodwill' },
      items: [],
      photos: [],
      milesDriven: 100,
      parkingAndTolls: 10,
      mileageRate: 0.14,
    };

    render(<DonationDetailsClient donation={mockMileageDonation} />);

    expect(screen.getByText('Goodwill')).toBeInTheDocument();
    expect(screen.getByText('MILEAGE')).toBeInTheDocument();
    expect(screen.getByText('Trip Breakdown')).toBeInTheDocument();
    expect(screen.getByText('100.0 mi')).toBeInTheDocument();
    expect(screen.getByText('$0.14/mi')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$24.00')).toBeInTheDocument();
  });

  it('renders related donations section when matching events are present', () => {
    const mockRelated = [
      {
        id: 42,
        date: '2026-05-12T00:00:00.000Z',
        organizationId: 1,
        type: 'MILEAGE',
        cashAmount: 14.00,
        assetTicker: null,
        assetShares: null,
        milesDriven: 100,
        parkingAndTolls: 0,
        mileageRate: 0.14,
        organization: { id: 1, name: 'Goodwill' },
        items: [],
        photos: [],
      }
    ];

    render(<DonationDetailsClient donation={mockItemsDonation} relatedDonations={mockRelated as unknown as DonationEvent[]} />);

    expect(screen.getByText('Related Donations (Same Date & Organization)')).toBeInTheDocument();
    expect(screen.getByText(/Related trip:/)).toBeInTheDocument();
    expect(screen.getByText('100 miles')).toBeInTheDocument();
    expect(screen.getByText(/14.00/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/donations/42');
  });
});
