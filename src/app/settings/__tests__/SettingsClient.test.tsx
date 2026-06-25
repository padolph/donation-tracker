import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsClient from '../SettingsClient';
import { updateSettings } from '@/app/actions/settingsActions';

// Mock the server actions
jest.mock('@/app/actions/settingsActions', () => ({
  updateSettings: jest.fn(),
}));

const mockSettings = {
  id: 1,
  marginalTaxRate: 0.32,
  estimatedAGI: 50000,
  updatedAt: new Date(),
};

describe('SettingsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current settings', () => {
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
    // 0.32 is displayed as 32(%)
    expect(screen.getByLabelText(/Marginal Tax Rate/i)).toHaveValue(32);
    expect(screen.getByLabelText(/Estimated AGI/i)).toHaveValue(50000);
  });

  it('applies correct container and form styling for left justification matching other pages', () => {
    const { container } = render(
      <SettingsClient
        initialSettings={mockSettings}
        databasePath="/mock/path/dev.db"
        storagePath="/mock/path/storage"
      />
    );
    
    // The main container should have p-4 sm:p-8 max-w-5xl mx-auto
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('p-4');
    expect(mainContainer).toHaveClass('sm:p-8');
    expect(mainContainer).toHaveClass('max-w-5xl');
    expect(mainContainer).toHaveClass('mx-auto');
    
    // The form itself should have max-w-2xl for styling
    const form = container.querySelector('form');
    expect(form).toHaveClass('max-w-2xl');
  });

  it('renders the database path as read-only', () => {
    const testPath = '/path/to/my/dev.db';
    render(<SettingsClient initialSettings={mockSettings} databasePath={testPath} storagePath="/mock/path/storage" />);
    
    const dbInput = screen.getByLabelText(/Database Path/i);
    expect(dbInput).toBeInTheDocument();
    expect(dbInput).toHaveValue(testPath);
    expect(dbInput).toHaveAttribute('readonly');
  });

  it('renders the image storage path as read-only', () => {
    const testStoragePath = '/path/to/my/storage/donations';
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath={testStoragePath} />);
    
    const storageInput = screen.getByLabelText(/Image Storage Path/i);
    expect(storageInput).toBeInTheDocument();
    expect(storageInput).toHaveValue(testStoragePath);
    expect(storageInput).toHaveAttribute('readonly');
  });

  it('updates the settings when form is submitted', async () => {
    (updateSettings as jest.Mock).mockResolvedValue({ success: true, settings: { ...mockSettings, marginalTaxRate: 0.35, estimatedAGI: 60000 } });
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
    
    const input = screen.getByLabelText(/Marginal Tax Rate/i);
    fireEvent.change(input, { target: { value: '35' } });

    const agiInput = screen.getByLabelText(/Estimated AGI/i);
    fireEvent.change(agiInput, { target: { value: '60000' } });
    
    const saveButton = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({ marginalTaxRate: 0.35, estimatedAGI: 60000 });
      expect(screen.getByText(/Settings updated successfully/i)).toBeInTheDocument();
    });
  });

  it('shows an error if update fails', async () => {
    (updateSettings as jest.Mock).mockResolvedValue({ success: false, error: 'Database error' });
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
    
    const saveButton = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument();
    });
  });

  it('should not display a leading zero when numeric inputs (tax rate, AGI) are cleared and edited', async () => {
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
    
    const taxRateInput = screen.getByLabelText(/Marginal Tax Rate/i);
    // Simulate user backspacing/clearing the input
    fireEvent.change(taxRateInput, { target: { value: '' } });
    expect(taxRateInput).toHaveValue(null);

    // Simulate user typing a new number
    fireEvent.change(taxRateInput, { target: { value: '5' } });
    expect(taxRateInput).toHaveValue(5);

    const agiInput = screen.getByLabelText(/Estimated AGI/i);
    // Simulate user backspacing/clearing the AGI input
    fireEvent.change(agiInput, { target: { value: '' } });
    expect(agiInput).toHaveValue(null);

    // Simulate user typing a new AGI number
    fireEvent.change(agiInput, { target: { value: '80000' } });
    expect(agiInput).toHaveValue(80000);
  });

  describe('Data Sync UI', () => {
    it('does not render the data sync panel controls', () => {
      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      expect(screen.queryByRole('heading', { name: /Data Sync/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Export Package/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Select Package to Import/i)).not.toBeInTheDocument();
    });
  });
});
