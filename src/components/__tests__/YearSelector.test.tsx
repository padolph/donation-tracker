import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import YearSelector from '../YearSelector';

describe('YearSelector', () => {
  it('renders correctly and handles change', () => {
    const onChange = jest.fn();
    render(<YearSelector currentYear={2026} onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('2026');
    
    // Check if some years are present (e.g., current and some previous)
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    
    fireEvent.change(select, { target: { value: '2025' } });
    expect(onChange).toHaveBeenCalledWith(2025);
  });
});
