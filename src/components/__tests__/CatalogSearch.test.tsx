import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogSearch from '../CatalogSearch';
import { searchItems } from '@/app/actions/itemActions';

jest.mock('@/app/actions/itemActions', () => ({
  searchItems: jest.fn(),
}));

describe('CatalogSearch', () => {
  const mockOnSelectItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    render(<CatalogSearch onSelectItem={mockOnSelectItem} />);
    expect(screen.getByPlaceholderText(/e\.g\. Men's Suit/i)).toBeInTheDocument();
  });

  it('calls searchItems and displays results when typing', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogSearch onSelectItem={mockOnSelectItem} />);
    const input = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);

    fireEvent.change(input, { target: { value: 'Winter' } });

    await waitFor(() => {
      expect(searchItems).toHaveBeenCalledWith('Winter');
    });

    await waitFor(() => {
      expect(screen.getByText(/Winter Coat/i)).toBeInTheDocument();
      expect(screen.getByText(/Clothing/i)).toBeInTheDocument();
    });
  });

  it('does not select an item automatically while typing', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogSearch onSelectItem={mockOnSelectItem} />);
    const input = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);

    fireEvent.change(input, { target: { value: 'Winter' } });

    await waitFor(() => {
      expect(screen.getByText(/Winter Coat/i)).toBeInTheDocument();
    });

    expect(mockOnSelectItem).not.toHaveBeenCalled();
    expect(input).toHaveValue('Winter');
  });

  it('selects an item when Enter is pressed on a highlighted result', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
      { id: 2, description: 'Winter Boots', category: { name: 'Footwear' }, defaultHigh: 60, defaultMedium: 30 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogSearch onSelectItem={mockOnSelectItem} />);
    const input = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);

    fireEvent.change(input, { target: { value: 'Winter' } });

    await screen.findByText(/Winter Coat/i);
    
    // Press ArrowDown to highlight the first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSelectItem).toHaveBeenCalledWith(mockItems[0]);
    expect(screen.queryByText(/Winter Coat/i)).not.toBeInTheDocument();
  });

  it('calls onSelectItem when a result is clicked', async () => {
    const mockItems = [
      { id: 1, description: 'Winter Coat', category: { name: 'Clothing' }, defaultHigh: 50, defaultMedium: 25 },
    ];
    (searchItems as jest.Mock).mockResolvedValue(mockItems);

    render(<CatalogSearch onSelectItem={mockOnSelectItem} />);
    const input = screen.getByPlaceholderText(/e\.g\. Men's Suit/i);

    fireEvent.change(input, { target: { value: 'Winter' } });

    const resultItem = await screen.findByText('Winter Coat');
    fireEvent.click(resultItem);

    expect(mockOnSelectItem).toHaveBeenCalledWith(mockItems[0]);
  });
});
