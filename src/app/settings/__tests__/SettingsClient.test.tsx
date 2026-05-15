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
    render(<SettingsClient initialSettings={mockSettings} />);
    // 0.32 is displayed as 32(%)
    expect(screen.getByLabelText(/Marginal Tax Rate/i)).toHaveValue(32);
  });

  it('updates the settings when form is submitted', async () => {
    (updateSettings as jest.Mock).mockResolvedValue({ success: true, settings: { ...mockSettings, marginalTaxRate: 0.35 } });
    render(<SettingsClient initialSettings={mockSettings} />);
    
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
    render(<SettingsClient initialSettings={mockSettings} />);
    
    const saveButton = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument();
    });
  });
});
