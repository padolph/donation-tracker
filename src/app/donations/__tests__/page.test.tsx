import { render, screen } from '@testing-library/react';
import DonationsPage from '../page';
import { getDonations } from '@/app/actions/donationActions';
import { getOrganizations } from '@/app/actions/organizationActions';

// Mock the server actions
jest.mock('@/app/actions/donationActions', () => ({
  getDonations: jest.fn(),
}));

jest.mock('@/app/actions/organizationActions', () => ({
  getOrganizations: jest.fn(),
}));

// Mock the client component so we just test the server page behavior
jest.mock('../DonationsClient', () => {
  return function MockDonationsClient(props: Record<string, unknown>) {
    return <div data-testid="donations-client">{JSON.stringify(props)}</div>;
  };
});

describe('DonationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data and renders the DonationsClient', async () => {
    const mockOrganizations = [{ id: 1, name: 'Org 1' }];
    const mockDonations = [{ id: 10, type: 'ITEMS' }];

    (getOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);
    (getDonations as jest.Mock).mockResolvedValue({ success: true, donations: mockDonations });

    // Since it's a Server Component, we await the result
    const Page = await DonationsPage();
    render(Page);

    // Verify it passes the data to the client component
    const clientComponent = screen.getByTestId('donations-client');
    expect(clientComponent).toBeInTheDocument();
    
    const props = JSON.parse(clientComponent.textContent || '{}');
    expect(props.organizations).toEqual(mockOrganizations);
    expect(props.initialDonations).toEqual(mockDonations);
  });
});