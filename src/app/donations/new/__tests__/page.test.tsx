import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonationBuilder from '../DonationBuilder';
import { searchItems, createCustomItem } from '@/app/actions/itemActions';
import { saveDonation } from '@/app/actions/donationActions';
import { savePhoto } from '@/app/actions/photoActions';

jest.mock('@/app/actions/itemActions', () => ({
  searchItems: jest.fn(),
  createCustomItem: jest.fn(),
}));

jest.mock('@/app/actions/donationActions', () => ({
  saveDonation: jest.fn(),
}));

jest.mock('@/app/actions/photoActions', () => ({
  savePhoto: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockOrganizations = [
  { id: 1, name: 'Red Cross' },
  { id: 2, name: 'University' },
  { id: 3, name: 'Goodwill' }
];

describe('DonationBuilder Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 1 } });
    (savePhoto as jest.Mock).mockImplementation(async (file: File) => `/mock/path/${file.name}`);
  });

  const renderComponent = () => render(<DonationBuilder initialOrganizations={mockOrganizations as unknown as []} />);

  it('searches for items and allows adding them to the donation', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    renderComponent();

    // 1. Search for an item
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });

    await waitFor(() => {
      expect(searchItems).toHaveBeenCalledWith('Winter');
    });

    // 2. Select the item
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);

    // 3. Form appears, confirm it
    expect(screen.getByText('Add Item to Donation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirm item/i }));

    // 4. Staged list updates
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0); // Good condition falls back to Medium (25)
  });

  it('allows adding a custom item if not found', async () => {
    (searchItems as jest.Mock).mockResolvedValue([]);
    (createCustomItem as jest.Mock).mockResolvedValue({
      id: 99,
      description: 'Vintage Radio',
      category: { name: 'Electronics' },
      defaultHigh: 40,
      defaultMedium: 20,
    });

    renderComponent();

    // 1. Click "Add Item" in header to open the form options
    const addButton = screen.getByTestId('add-item-button');
    fireEvent.click(addButton);

    // 2. Fill Custom Item Form
    fireEvent.change(screen.getByLabelText(/item description/i), { target: { value: 'Vintage Radio' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Electronics' } });
    fireEvent.change(screen.getByLabelText(/high value/i), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(/medium value/i), { target: { value: '20' } });
    
    // 3. Save Custom Item
    fireEvent.click(screen.getByRole('button', { name: /save custom item/i }));

    await waitFor(() => {
      expect(createCustomItem).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Vintage Radio',
        categoryName: 'Electronics',
        defaultHigh: 40,
        defaultMedium: 20,
      }));
    });

    // 4. Verify it auto-selects the new item for the staging list
    expect(screen.getByText('Add Item to Donation')).toBeInTheDocument();
    expect(screen.getByText('Vintage Radio')).toBeInTheDocument();
  });

  it('submits a Cash donation', async () => {
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 101 } });

    renderComponent();

    // 1. Select Cash type
    fireEvent.click(screen.getByText(/Cash/i, { selector: 'span' }));

    // 2. Fill General Info
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '1' } });

    // 3. Enter Cash Amount
    const cashInput = screen.getByLabelText(/Cash Amount/i);
    fireEvent.change(cashInput, { target: { value: '500' } });

    // 4. Save Donation
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDonation).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 1,
        type: 'CASH',
        cashAmount: 500,
        items: [],
      }));
    });
  });

  it('submits an Asset donation', async () => {
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 102 } });

    renderComponent();

    // 1. Select Asset type
    fireEvent.click(screen.getByText(/Stock\/Asset/i, { selector: 'span' }));

    // 2. Fill General Info
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '2' } });

    // 3. Enter Asset Details
    fireEvent.change(screen.getByLabelText(/Asset Ticker/i), { target: { value: 'AAPL' } });
    fireEvent.change(screen.getByLabelText(/Number of Shares/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Total Value/i), { target: { value: '1500' } });

    // 4. Save Donation
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDonation).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 2,
        type: 'ASSETS',
        assetTicker: 'AAPL',
        assetShares: 10,
        cashAmount: 1500,
        items: [],
      }));
    });
  });

  it('submits the full donation session', async () => {
    (searchItems as jest.Mock).mockResolvedValue([
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ]);
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 100 } });
    (savePhoto as jest.Mock).mockResolvedValue('/mock/path.jpg');

    renderComponent();

    // 1. Fill General Info
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '3' } });

    // 2. Add an item
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);
    fireEvent.click(screen.getByRole('button', { name: /confirm item/i }));

    // 3. Save Donation
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDonation).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 3,
        type: 'ITEMS',
        items: [
          expect.objectContaining({
            itemId: 1,
            quantity: 1,
            condition: 'Medium',
            lockedValue: 25,
          }),
        ],
      }));
    });
  });

  it('enables the Add Donation button only when organization and items are present', async () => {
    (searchItems as jest.Mock).mockResolvedValue([
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ]);

    renderComponent();

    // Initial state: disabled
    expect(screen.getByRole('button', { name: /add items to continue/i })).toBeDisabled();

    // Add organization only: still disabled
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '3' } });
    expect(screen.getByRole('button', { name: /add items to continue/i })).toBeDisabled();

    // Add item (and clear organization): still disabled
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '' } });
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);
    fireEvent.click(screen.getByRole('button', { name: /confirm item/i }));
    
    // Dynamic text change
    expect(screen.getByRole('button', { name: /enter organization/i })).toBeDisabled();

    // Both present: enabled
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '3' } });
    expect(screen.getByRole('button', { name: /add donation/i })).toBeEnabled();
  });

  it('shows an alert when a photo exceeds the 10MB limit', () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderComponent();

    // In RTL, we find the hidden input by its presence or the label
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'too-big.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(alertMock).toHaveBeenCalledWith('File "too-big.jpg" is too large. Max size is 10MB.');
    alertMock.mockRestore();
  });

  it('correctly initializes assetValue when editing an asset donation', () => {
    const mockInitialDonation = {
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
    };

    render(<DonationBuilder initialDonation={mockInitialDonation as never} initialOrganizations={mockOrganizations as never} />);

    // Total Value should be $500.25
    expect(screen.getByText('$500.25')).toBeInTheDocument();

    // The asset value input should have "500.25"
    const assetValueInput = screen.getByLabelText(/Total Value on Date/i);
    expect(assetValueInput).toHaveValue(500.25);
  });
});
