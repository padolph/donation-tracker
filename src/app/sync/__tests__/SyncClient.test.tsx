import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SyncClient from '../SyncClient';
import { parseSyncPackage, importSyncPackage } from '@/app/actions/syncActions';

// Mock the sync actions
jest.mock('@/app/actions/syncActions', () => ({
  parseSyncPackage: jest.fn(),
  importSyncPackage: jest.fn(),
}));

describe('SyncClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the export/import controls', () => {
    render(<SyncClient />);
    
    // Page header checks
    expect(screen.getByRole('heading', { name: /Export\/Import/i })).toBeInTheDocument();
    expect(screen.getByText(/Export or import\/merge local donation tracker data packages/i)).toBeInTheDocument();

    // Export panel checks
    expect(screen.getByRole('heading', { name: /Export Package/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Export Sync Package/i })).toBeInTheDocument();
    
    // Import panel checks
    expect(screen.getByRole('heading', { name: /Import Package/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Sync Package/i)).toBeInTheDocument();
  });

  it('applies correct responsive container styling matching other pages', () => {
    const { container } = render(<SyncClient />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('p-4');
    expect(mainContainer).toHaveClass('sm:p-8');
    expect(mainContainer).toHaveClass('max-w-5xl');
    expect(mainContainer).toHaveClass('mx-auto');
    
    // Check that sections have container boxes
    const panels = container.querySelectorAll('.bg-white\\/5');
    expect(panels.length).toBeGreaterThanOrEqual(1);
    panels.forEach(panel => {
      expect(panel).toHaveClass('border');
      expect(panel).toHaveClass('border-white/10');
      expect(panel).toHaveClass('rounded-2xl');
      expect(panel).toHaveClass('max-w-2xl');
    });
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

    render(<SyncClient />);
    
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

  it('shows error message if parsing fails', async () => {
    (parseSyncPackage as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Invalid zip magic header',
    });

    render(<SyncClient />);
    
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

    render(<SyncClient />);
    
    const file = new File(['mock content'], 'sync.dtpack', { type: 'application/octet-stream' });
    const input = screen.getByLabelText(/Select Sync Package/i);
    
    fireEvent.change(input, { target: { files: [file] } });

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

    render(<SyncClient />);
    
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
