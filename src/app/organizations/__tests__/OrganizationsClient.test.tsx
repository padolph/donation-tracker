import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationsClient from '../OrganizationsClient';
import { deleteOrganization } from '@/app/actions/organizationActions';

jest.mock('@/app/actions/organizationActions', () => ({
  deleteOrganization: jest.fn(),
}));

const mockOrganizations = [
  {
    id: 1,
    name: 'Goodwill',
    address: '123 Main St',
    taxId: '12-345',
    totalDonated: 150.50,
  },
  {
    id: 2,
    name: 'Red Cross',
    address: '456 Oak Ave',
    taxId: '98-765',
    totalDonated: 0,
  },
];

describe('OrganizationsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a list of organizations', () => {
    render(<OrganizationsClient initialOrganizations={mockOrganizations as any} />);
    
    expect(screen.getByText('Goodwill')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    
    expect(screen.getByText('Red Cross')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('opens the add organization modal when clicking Add New', () => {
    render(<OrganizationsClient initialOrganizations={mockOrganizations as any} />);
    
    expect(screen.queryByText('Add Organization')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Add New/i }));
    
    expect(screen.getByText('Add Organization')).toBeInTheDocument();
  });

  it('opens the edit modal with correct data when clicking Edit', () => {
    render(<OrganizationsClient initialOrganizations={mockOrganizations as any} />);
    
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editButtons[0]); // Edit Goodwill
    
    expect(screen.getByText('Edit Organization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Goodwill')).toBeInTheDocument();
  });

  it('calls deleteOrganization and shows a confirmation', async () => {
    (deleteOrganization as jest.Mock).mockResolvedValue({ success: true });
    
    // Mock confirm dialog
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<OrganizationsClient initialOrganizations={mockOrganizations as any} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]); // Delete Goodwill
    
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Are you sure you want to delete'));
    
    await waitFor(() => {
      expect(deleteOrganization).toHaveBeenCalledWith(1);
    });
    
    confirmSpy.mockRestore();
  });

  it('does not call deleteOrganization if user cancels confirmation', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<OrganizationsClient initialOrganizations={mockOrganizations as any} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(deleteOrganization).not.toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });
});
