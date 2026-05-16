import { render, screen, fireEvent } from '@testing-library/react';
import CatalogBrowse from '../CatalogBrowse';
import { getCategories, getItemsByCategory } from '@/app/actions/itemActions';

jest.mock('@/app/actions/itemActions', () => ({
  getCategories: jest.fn(),
  getItemsByCategory: jest.fn(),
}));

describe('CatalogBrowse', () => {
  const mockOnSelectItem = jest.fn();
  const mockCategories = [
    { id: 1, name: 'Clothing' },
    { id: 2, name: 'Household' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  it('renders categories on initial load', async () => {
    render(<CatalogBrowse onSelectItem={mockOnSelectItem} />);
    
    expect(await screen.findByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Household')).toBeInTheDocument();
  });

  it('drills down into a category and subcategories', async () => {
    const mockItems = [
      { id: 101, description: "Clothing: Men's: Suit", category: { name: 'Clothing' }, defaultHigh: 100, defaultMedium: 50 },
      { id: 102, description: "Clothing: Women's: Dress", category: { name: 'Clothing' }, defaultHigh: 80, defaultMedium: 40 },
    ];
    (getItemsByCategory as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogBrowse onSelectItem={mockOnSelectItem} />);
    
    // Click on Clothing category
    fireEvent.click(await screen.findByText('Clothing'));

    // Should now show subcategories: Men's and Women's
    expect(await screen.findByText("Men's")).toBeInTheDocument();
    expect(screen.getByText("Women's")).toBeInTheDocument();

    // Click on Men's subcategory
    fireEvent.click(screen.getByText("Men's"));

    // Should now show the item: Suit
    expect(await screen.findByText('Suit')).toBeInTheDocument();
    expect(screen.getByText('$100.00 / $50.00')).toBeInTheDocument();
  });

  it('calls onSelectItem when an item is clicked', async () => {
    const mockItems = [
      { id: 101, description: "Clothing: Shirt", category: { name: 'Clothing' }, defaultHigh: 20, defaultMedium: 10 },
    ];
    (getItemsByCategory as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogBrowse onSelectItem={mockOnSelectItem} />);
    
    fireEvent.click(await screen.findByText('Clothing'));
    
    fireEvent.click(await screen.findByText('Shirt'));

    expect(mockOnSelectItem).toHaveBeenCalledWith(mockItems[0]);
  });

  it('allows navigating back up the hierarchy', async () => {
    const mockItems = [
      { id: 101, description: "Clothing: Men's: Suit", category: { name: 'Clothing' }, defaultHigh: 100, defaultMedium: 50 },
    ];
    (getItemsByCategory as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogBrowse onSelectItem={mockOnSelectItem} />);
    
    fireEvent.click(await screen.findByText('Clothing'));
    expect(await screen.findByText("Men's")).toBeInTheDocument();

    // Navigate back to root
    fireEvent.click(screen.getByText('Categories'));
    expect(await screen.findByText('Clothing')).toBeInTheDocument();
  });
});
