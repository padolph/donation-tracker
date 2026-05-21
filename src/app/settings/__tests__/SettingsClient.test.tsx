import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsClient from '../SettingsClient';
import { updateSettings } from '@/app/actions/settingsActions';

// Mock the server action
jest.mock('@/app/actions/settingsActions', () => ({
  updateSettings: jest.fn(),
}));

const mockSettings = {
  id: 1,
  marginalTaxRate: 0.32,
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
    (updateSettings as jest.Mock).mockResolvedValue({ success: true, settings: { ...mockSettings, marginalTaxRate: 0.35 } });
    render(<SettingsClient initialSettings={mockSettings} databasePath="/mock/path/dev.db" storagePath="/mock/path/storage" />);
    
    const input = screen.getByLabelText(/Marginal Tax Rate/i);
    fireEvent.change(input, { target: { value: '35' } });
    
    const saveButton = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({ marginalTaxRate: 0.35 });
    });
    expect(screen.getByText(/Settings updated successfully/i)).toBeInTheDocument();
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
});
