import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsClient from '../SettingsClient';
import { updateSettings } from '@/app/actions/settingsActions';
import { parseSyncPackage, importSyncPackage } from '@/app/actions/syncActions';

// Mock the server actions
jest.mock('@/app/actions/settingsActions', () => ({
  updateSettings: jest.fn(),
}));

jest.mock('@/app/actions/syncActions', () => ({
  parseSyncPackage: jest.fn(),
  importSyncPackage: jest.fn(),
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
    it('renders the data sync panel controls', () => {
      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      expect(screen.getByRole('heading', { name: /Data Sync/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Export Sync Package/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Select Sync Package/i)).toBeInTheDocument();
    });

    it('triggers parsing when a sync package file is selected', async () => {
      (parseSyncPackage as jest.Mock).mockResolvedValueOnce({
        success: true,
        summary: {
          categories: 3,
          items: 4,
          organizations: 2,
          events: 5,
          photos: 6,
        },
      });

      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      const file = new File(['mock content'], 'sync.dtpack', { type: 'application/octet-stream' });
      const input = screen.getByLabelText(/Select Sync Package/i);
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(parseSyncPackage).toHaveBeenCalled();
        expect(screen.getByText(/Ready to import:/i)).toBeInTheDocument();
        expect(screen.getByText(/3 Categories/i)).toBeInTheDocument();
        expect(screen.getByText(/4 Items/i)).toBeInTheDocument();
        expect(screen.getByText(/2 Organizations/i)).toBeInTheDocument();
        expect(screen.getByText(/5 Donation Events/i)).toBeInTheDocument();
        expect(screen.getByText(/6 Receipt Photos/i)).toBeInTheDocument();
      });
    });

    it('shows error message if parse fails', async () => {
      (parseSyncPackage as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Invalid zip magic header',
      });

      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      const file = new File(['mock content'], 'bad.dtpack', { type: 'application/octet-stream' });
      const input = screen.getByLabelText(/Select Sync Package/i);
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Invalid zip magic header/i)).toBeInTheDocument();
        expect(screen.queryByText(/Ready to import:/i)).not.toBeInTheDocument();
      });
    });

    it('submits file for import when confirm merge is clicked', async () => {
      (parseSyncPackage as jest.Mock).mockResolvedValueOnce({
        success: true,
        summary: {
          categories: 1,
          items: 1,
          organizations: 1,
          events: 1,
          photos: 1,
        },
      });
      (importSyncPackage as jest.Mock).mockResolvedValueOnce({ success: true });

      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      const file = new File(['mock content'], 'sync.dtpack', { type: 'application/octet-stream' });
      const input = screen.getByLabelText(/Select Sync Package/i);
      
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for summary to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm Import & Merge/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm Import & Merge/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(importSyncPackage).toHaveBeenCalled();
        expect(screen.getByText(/Data imported successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error if import fails', async () => {
      (parseSyncPackage as jest.Mock).mockResolvedValueOnce({
        success: true,
        summary: {
          categories: 1,
          items: 1,
          organizations: 1,
          events: 1,
          photos: 1,
        },
      });
      (importSyncPackage as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Database constraint violation',
      });

      render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
      
      const file = new File(['mock content'], 'sync.dtpack', { type: 'application/octet-stream' });
      const input = screen.getByLabelText(/Select Sync Package/i);
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm Import & Merge/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm Import & Merge/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Database constraint violation/i)).toBeInTheDocument();
      });
    });
  });
});
