import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonationBuilder from '../DonationBuilder';
import { searchItems, createCustomItem, getCategories } from '@/app/actions/itemActions';
import { saveDonation } from '@/app/actions/donationActions';
import { savePhoto } from '@/app/actions/photoActions';

jest.mock('@/app/actions/itemActions', () => ({
  searchItems: jest.fn(),
  createCustomItem: jest.fn(),
  getCategories: jest.fn(),
  getItemsByCategory: jest.fn(),
}));

jest.mock('@/app/actions/donationActions', () => ({
  saveDonation: jest.fn(),
}));

jest.mock('@/app/actions/photoActions', () => ({
  savePhoto: jest.fn(),
}));

const mockPush = jest.fn();
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
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
    mockGet.mockReturnValue(null);
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 1 } });
    (savePhoto as jest.Mock).mockImplementation(async (file: File) => `/mock/path/${file.name}`);
    (getCategories as jest.Mock).mockResolvedValue([]);
  });

  const renderComponent = () => render(<DonationBuilder initialOrganizations={mockOrganizations as unknown as []} />);

  it('allows switching between Search and Browse modes', async () => {
    (getCategories as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Clothing' }
    ]);

    renderComponent();

    // Default should be Search
    expect(screen.getByPlaceholderText(/e\.g\. Men's Suit/i)).toBeInTheDocument();

    // Switch to Browse
    const browseToggle = screen.getByRole('button', { name: /browse/i });
    fireEvent.click(browseToggle);

    // Should now show browse component (by checking for category text)
    expect(await screen.findByText('Clothing')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/e\.g\. Men's Suit/i)).not.toBeInTheDocument();

    // Switch back to Search
    const searchToggle = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchToggle);
    expect(screen.getByPlaceholderText(/e\.g\. Men's Suit/i)).toBeInTheDocument();
  });

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
    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0); // Medium condition gets the defaultMedium value (25)
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

  it('renders a preview image when a valid photo is uploaded', async () => {
    const createObjectURLMock = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-photo-url');
    const revokeObjectURLMock = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderComponent();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-content'], 'test-image.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the preview image to be rendered
    const previewImg = await screen.findByRole('img');
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveAttribute('src', 'blob:mock-photo-url');
    expect(previewImg).toHaveAttribute('alt', 'test-image.jpg');

    // Click remove button
    const removeBtn = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeBtn);

    // Wait for it to be removed
    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-photo-url');

    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it('does not render a preview image if the created object URL is invalid (not starting with blob:)', async () => {
    const createObjectURLMock = jest.spyOn(URL, 'createObjectURL').mockReturnValue('http://malicious-site.com/xss.jpg');
    const revokeObjectURLMock = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderComponent();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-content'], 'test-image.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    // We wait briefly to make sure effect ran, but the image should NOT be rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it('renders mileage form fields when Mileage type is selected', async () => {
    renderComponent();

    // Click Mileage donation type button
    const mileageTypeBtn = screen.getByText('Mileage');
    fireEvent.click(mileageTypeBtn);

    // Verify fields appear
    expect(screen.getByLabelText('Miles Driven')).toBeInTheDocument();
    expect(screen.getByLabelText('Standard Mileage Rate ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Parking & Tolls ($)')).toBeInTheDocument();
  });

  it('performs correct real-time preview calculations for mileage donations', async () => {
    renderComponent();

    const mileageTypeBtn = screen.getByText('Mileage');
    fireEvent.click(mileageTypeBtn);

    const milesInput = screen.getByLabelText('Miles Driven');
    const parkingInput = screen.getByLabelText('Parking & Tolls ($)');

    // 100 miles, $10 parking -> 100 * 0.14 + 10 = $24.00
    fireEvent.change(milesInput, { target: { value: '100' } });
    fireEvent.change(parkingInput, { target: { value: '10' } });

    expect(screen.getByText('$24.00')).toBeInTheDocument();
  });

  it('pre-populates activeType, organizationId, and date from URL search parameters on initialization', async () => {
    // Mock get search params:
    mockGet.mockImplementation((param) => {
      if (param === 'type') return 'mileage';
      if (param === 'orgId') return '2';
      if (param === 'date') return '2026-07-07';
      return null;
    });

    renderComponent();

    // Verify activeType is Mileage (checking for trip breakdown / mileage rate label)
    expect(screen.getByLabelText('Miles Driven')).toBeInTheDocument();

    // Verify organization select pre-populated to '2'
    const orgSelect = screen.getByRole('combobox', { name: /organization/i });
    expect(orgSelect).toHaveValue('2');

    // Verify date pre-populated to '2026-07-07'
    const dateInput = screen.getByLabelText('Donation Date');
    expect(dateInput).toHaveValue('2026-07-07');
  });

  it('displays post-save confirmation prompt after saving/updating an ITEMS donation', async () => {
    (saveDonation as jest.Mock).mockResolvedValue({ success: true, donation: { id: 100 } });

    renderComponent();

    // Set date explicitly for determinism
    const dateInput = screen.getByLabelText('Donation Date');
    fireEvent.change(dateInput, { target: { value: '2026-07-08' } });

    // Fill Info
    fireEvent.change(screen.getByRole('combobox', { name: /organization/i }), { target: { value: '3' } });
    
    // Add item (need to mock searchItems)
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);
    fireEvent.click(screen.getByRole('button', { name: /confirm item/i }));

    // Click Save
    const saveButton = screen.getByRole('button', { name: /add donation/i });
    fireEvent.click(saveButton);

    // Wait for the modal prompt to appear
    await waitFor(() => {
      expect(screen.getByText('Donation Saved successfully!')).toBeInTheDocument();
      expect(screen.getByText('Would you like to log the volunteer mileage driven for this donation?')).toBeInTheDocument();
    });

    // Clicking "Yes, Log Mileage" should route correctly
    const yesButton = screen.getByRole('button', { name: /yes, log mileage/i });
    fireEvent.click(yesButton);
    expect(mockPush).toHaveBeenCalledWith('/donations/new?type=mileage&orgId=3&date=2026-07-08');
  });

  it('resets form states when search parameters change', async () => {
    let mockParams: Record<string, string | null> = {
      type: null,
      orgId: null,
      date: null,
    };
    mockGet.mockImplementation((param) => {
      if (param === 'type') return mockParams.type;
      if (param === 'orgId') return mockParams.orgId;
      if (param === 'date') return mockParams.date;
      return null;
    });

    const { rerender } = renderComponent();

    // Verify initial is items (since params are null)
    expect(screen.queryByLabelText('Miles Driven')).not.toBeInTheDocument();

    // Now change mock search params and rerender
    mockParams = {
      type: 'mileage',
      orgId: '3',
      date: '2026-07-09',
    };

    rerender(
      <DonationBuilder 
        key="new-key"
        initialOrganizations={mockOrganizations} 
      />
    );

    // Verify it switched to mileage and pre-populated the values
    expect(screen.getByLabelText('Miles Driven')).toBeInTheDocument();
    
    const orgSelect = screen.getByRole('combobox', { name: /organization/i });
    expect(orgSelect).toHaveValue('3');

    const dateInput = screen.getByLabelText('Donation Date');
    expect(dateInput).toHaveValue('2026-07-09');
  });

  it('selects all text in numeric input fields on focus', async () => {
    renderComponent();

    // 1. Test quantity input (must add an item first to render this input)
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);
    const searchInput = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);
    fireEvent.change(searchInput, { target: { value: 'Winter' } });
    const resultItem = await screen.findByText(/Winter Coat/i);
    fireEvent.click(resultItem);

    const qtyInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
    const selectQtySpy = jest.spyOn(qtyInput, 'select');
    qtyInput.focus();
    expect(selectQtySpy).toHaveBeenCalled();

    // 2. Test cash input
    fireEvent.click(screen.getByText(/Cash/i, { selector: 'span' }));
    const cashInput = screen.getByLabelText(/Cash Amount/i) as HTMLInputElement;
    const selectCashSpy = jest.spyOn(cashInput, 'select');
    cashInput.focus();
    expect(selectCashSpy).toHaveBeenCalled();

    // 3. Test asset inputs
    fireEvent.click(screen.getByText(/Stock\/Asset/i, { selector: 'span' }));
    const assetSharesInput = screen.getByLabelText(/Number of Shares/i) as HTMLInputElement;
    const selectSharesSpy = jest.spyOn(assetSharesInput, 'select');
    assetSharesInput.focus();
    expect(selectSharesSpy).toHaveBeenCalled();

    const assetValueInput = screen.getByLabelText(/Total Value/i) as HTMLInputElement;
    const selectValSpy = jest.spyOn(assetValueInput, 'select');
    assetValueInput.focus();
    expect(selectValSpy).toHaveBeenCalled();

    // 4. Test mileage inputs
    fireEvent.click(screen.getByText(/Mileage/i, { selector: 'span' }));
    const milesDrivenInput = screen.getByLabelText(/Miles Driven/i) as HTMLInputElement;
    const selectMilesSpy = jest.spyOn(milesDrivenInput, 'select');
    milesDrivenInput.focus();
    expect(selectMilesSpy).toHaveBeenCalled();

    const parkingTollsInput = screen.getByLabelText(/Parking & Tolls/i) as HTMLInputElement;
    const selectParkingSpy = jest.spyOn(parkingTollsInput, 'select');
    parkingTollsInput.focus();
    expect(selectParkingSpy).toHaveBeenCalled();
  });
});

