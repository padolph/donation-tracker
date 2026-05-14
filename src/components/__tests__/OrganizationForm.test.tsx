import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationForm from '../OrganizationForm';
import { createOrganization, updateOrganization } from '@/app/actions/organizationActions';

// Mock the server actions
jest.mock('@/app/actions/organizationActions', () => ({
  createOrganization: jest.fn(),
  updateOrganization: jest.fn(),
}));

describe('OrganizationForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for creating a new organization', () => {
    render(<OrganizationForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Add Organization')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tax ID/i)).toBeInTheDocument();
  });

  it('renders correctly for editing an existing organization', () => {
    const initialData = {
      id: 1,
      name: 'Test Org',
      address: '123 Test St',
      taxId: '12345',
    };
    
    render(<OrganizationForm initialData={initialData} onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Edit Organization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
  });

  it('submits data to createOrganization when no initialData is provided', async () => {
    (createOrganization as jest.Mock).mockResolvedValue({ success: true, organization: { id: 2, name: 'New Org' } });

    render(<OrganizationForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Org' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(createOrganization).toHaveBeenCalledWith({
        name: 'New Org',
        address: '',
        taxId: '',
      });
      expect(mockOnSave).toHaveBeenCalledWith({ id: 2, name: 'New Org' });
    });
  });

  it('submits data to updateOrganization when initialData is provided', async () => {
    (updateOrganization as jest.Mock).mockResolvedValue({ success: true, organization: { id: 1, name: 'Updated Org' } });

    const initialData = { id: 1, name: 'Test Org' };
    render(<OrganizationForm initialData={initialData} onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Updated Org' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(updateOrganization).toHaveBeenCalledWith(1, {
        name: 'Updated Org',
        address: '',
        taxId: '',
      });
      expect(mockOnSave).toHaveBeenCalledWith({ id: 1, name: 'Updated Org' });
    });
  });

  it('handles error when saving fails', async () => {
    (createOrganization as jest.Mock).mockResolvedValue({ success: false, error: 'Save failed' });
    
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<OrganizationForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Org' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(createOrganization).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Save failed');
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<OrganizationForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
