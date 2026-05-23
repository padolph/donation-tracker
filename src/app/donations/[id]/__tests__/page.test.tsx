import { render, screen } from '@testing-library/react';
import DonationDetailsPage from '../page';
import { getDonationById } from '@/app/actions/donationActions';
import { notFound } from 'next/navigation';

// Mock getDonationById
jest.mock('@/app/actions/donationActions', () => ({
  getDonationById: jest.fn(),
}));

// Mock next/navigation notFound
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock the client component
jest.mock('../DonationDetailsClient', () => {
  return function MockDonationDetailsClient(props: Record<string, unknown>) {
    return <div data-testid="donation-details-client">{JSON.stringify(props)}</div>;
  };
});

describe('DonationDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls notFound if id is not a number', async () => {
    const params = Promise.resolve({ id: 'abc' });
    await DonationDetailsPage({ params });
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound if donation fetch fails', async () => {
    (getDonationById as jest.Mock).mockResolvedValue({ success: false });
    const params = Promise.resolve({ id: '123' });
    await DonationDetailsPage({ params });
    expect(notFound).toHaveBeenCalled();
  });

  it('fetches donation details and renders DonationDetailsClient', async () => {
    const mockDonation = { id: 123, type: 'ITEMS', organization: { name: 'Goodwill' } };
    (getDonationById as jest.Mock).mockResolvedValue({ success: true, donation: mockDonation });

    const params = Promise.resolve({ id: '123' });
    const Page = await DonationDetailsPage({ params });
    render(Page);

    expect(getDonationById).toHaveBeenCalledWith(123);
    const clientComponent = screen.getByTestId('donation-details-client');
    expect(clientComponent).toBeInTheDocument();
    
    const props = JSON.parse(clientComponent.textContent || '{}');
    expect(props.donation).toEqual(mockDonation);
  });
});
