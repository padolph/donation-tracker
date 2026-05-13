import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonationBuilder from '../page';
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

describe('DonationBuilder Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows adding an item to the staging list', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    render(<DonationBuilder />);

    // 1. Search for an item
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });

    // 2. Select the item
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);

    // 3. Item details should appear (Quantity, Condition)
    expect(screen.getByText(/Add Item to Donation/i)).toBeInTheDocument();
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    const conditionSelect = screen.getByLabelText(/condition/i);
    fireEvent.change(conditionSelect, { target: { value: 'High' } });

    // 4. Add to staging list
    const addButton = screen.getByRole('button', { name: /confirm item/i });
    fireEvent.click(addButton);

    // 5. Verify it's in the list and total is updated
    expect(screen.getByText(/Winter Coat/i)).toBeInTheDocument();
    expect(screen.getByText(/High · Qty: 2/i)).toBeInTheDocument();
    
    // Check for total value by looking for the components
    expect(screen.getByText(/Total Value:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$100\.00/i)).toHaveLength(2); // One in list, one in total
  });

  it('allows adding a custom item', async () => {
    (createCustomItem as jest.Mock).mockResolvedValue({
      id: 99,
      description: 'Vintage Radio',
      category: { name: 'Electronics' },
      defaultHigh: 40,
      defaultMedium: 20,
    });

    render(<DonationBuilder />);

    // 1. Click "Add Item" in header to open the form options
    const addButton = screen.getByTestId('add-item-button');
    fireEvent.click(addButton);

    // 2. Fill out the form
    fireEvent.change(screen.getByLabelText(/item description/i), { target: { value: 'Vintage Radio' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Electronics' } });
    fireEvent.change(screen.getByLabelText(/high value/i), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(/medium value/i), { target: { value: '20' } });

    // 3. Submit
    const saveButton = screen.getByRole('button', { name: /save custom item/i });
    fireEvent.click(saveButton);

    // 4. Verify it's selected and ready to be added to donation
    await waitFor(() => {
      expect(createCustomItem).toHaveBeenCalled();
      expect(screen.getByText(/Add Item to Donation/i)).toBeInTheDocument();
      expect(screen.getByText(/Vintage Radio/i)).toBeInTheDocument();
    });
  });

  it('submits a Cash donation', async () => {
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 101 } });

    render(<DonationBuilder />);

    // 1. Select Cash type
    fireEvent.click(screen.getByText(/Cash/i, { selector: 'span' }));

    // 2. Fill General Info
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Red Cross' } });

    // 3. Enter Cash Amount
    const cashInput = screen.getByLabelText(/Cash Amount/i);
    fireEvent.change(cashInput, { target: { value: '500' } });

    // 4. Save Donation
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDonation).toHaveBeenCalledWith(expect.objectContaining({
        organization: 'Red Cross',
        type: 'CASH',
        cashAmount: 500,
        items: [],
      }));
    });
  });

  it('submits an Asset donation', async () => {
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 102 } });

    render(<DonationBuilder />);

    // 1. Select Asset type
    fireEvent.click(screen.getByText(/Stock\/Asset/i, { selector: 'span' }));

    // 2. Fill General Info
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'University' } });

    // 3. Enter Asset Details
    fireEvent.change(screen.getByLabelText(/Asset Ticker/i), { target: { value: 'AAPL' } });
    fireEvent.change(screen.getByLabelText(/Number of Shares/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Total Value/i), { target: { value: '1500' } });

    // 4. Save Donation
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDonation).toHaveBeenCalledWith(expect.objectContaining({
        organization: 'University',
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

    render(<DonationBuilder />);

    // 1. Fill General Info
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Goodwill' } });

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
        organization: 'Goodwill',
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

    render(<DonationBuilder />);

    // Initial state: disabled
    expect(screen.getByRole('button', { name: /add items to continue/i })).toBeDisabled();

    // Add organization only: still disabled
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Goodwill' } });
    expect(screen.getByRole('button', { name: /add items to continue/i })).toBeDisabled();

    // Add item (and clear organization): still disabled
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: '' } });
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);
    fireEvent.click(screen.getByRole('button', { name: /confirm item/i }));
    
    // Dynamic text change
    expect(screen.getByRole('button', { name: /enter organization/i })).toBeDisabled();

    // Both present: enabled
    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Goodwill' } });
    expect(screen.getByRole('button', { name: /add donation/i })).toBeEnabled();
  });

  it('shows an alert when a photo exceeds the 10MB limit', () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<DonationBuilder />);

    // In RTL, we find the hidden input by its presence or the label
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'too-big.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(alertMock).toHaveBeenCalledWith('File "too-big.jpg" is too large. Max size is 10MB.');
    alertMock.mockRestore();
  });
});
