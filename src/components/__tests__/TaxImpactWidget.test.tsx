import React from 'react';
import { render, screen } from '@testing-library/react';
import TaxImpactWidget from '../TaxImpactWidget';

describe('TaxImpactWidget', () => {
  it('renders correctly', () => {
    render(<TaxImpactWidget taxSavings={544.16} marginalTaxRate={0.32} />);
    
    expect(screen.getByText('$544.16')).toBeInTheDocument();
    expect(screen.getByText(/32(\.0)?%/)).toBeInTheDocument();
  });
});
