import React from 'react';
import { render, screen } from '@testing-library/react';
import TaxImpactWidget from '../TaxImpactWidget';

describe('TaxImpactWidget', () => {
  it('renders default state correctly for non-2026 years', () => {
    render(<TaxImpactWidget taxSavings={544.16} marginalTaxRate={0.32} year={2025} calculationState="default" />);
    
    expect(screen.getByText('$544.16')).toBeInTheDocument();
    expect(screen.getByText(/32(\.0)?%/)).toBeInTheDocument();
    expect(screen.getByText(/You can adjust this in the settings/i)).toBeInTheDocument();
  });

  it('renders State 1 correctly (Below the Floor)', () => {
    render(
      <TaxImpactWidget
        taxSavings={0}
        marginalTaxRate={0.32}
        year={2026}
        calculationState="below_floor"
        floor={500}
        floorRemaining={100}
      />
    );

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText(/You are/)).toBeInTheDocument();
    expect(screen.getByText(/\$100.00/)).toBeInTheDocument();
    expect(screen.getByText(/away from clearing your statutory 2026 0.5% AGI floor/)).toBeInTheDocument();
    expect(screen.getByText(/\$500.00/)).toBeInTheDocument();
  });

  it('renders State 2 correctly (Active Zone)', () => {
    render(
      <TaxImpactWidget
        taxSavings={800}
        marginalTaxRate={0.32}
        year={2026}
        calculationState="active"
        allowedContributionsRemaining={87000}
      />
    );

    expect(screen.getByText('$800.00')).toBeInTheDocument();
    expect(screen.getByText(/actively saving you money/i)).toBeInTheDocument();
  });

  it('renders State 3 correctly (Maximized Ceiling)', () => {
    render(
      <TaxImpactWidget
        taxSavings={28640}
        marginalTaxRate={0.32}
        year={2026}
        calculationState="max_ceiling"
      />
    );

    expect(screen.getByText('$28,640.00')).toBeInTheDocument();
    expect(screen.getByText(/fully maximized your allowable 2026 deductions/i)).toBeInTheDocument();
  });

  it('renders the link to settings page with "Adjust Tax Settings" text', () => {
    render(<TaxImpactWidget taxSavings={544.16} marginalTaxRate={0.32} year={2025} calculationState="default" />);
    
    const link = screen.getByRole('link', { name: /Adjust Tax Settings/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('renders cascading remaining capacity indicators and handles maximized warnings when year is 2026', () => {
    render(
      <TaxImpactWidget
        taxSavings={800}
        marginalTaxRate={0.32}
        year={2026}
        calculationState="active"
        allowedContributionsRemaining={79000}
        cashRoomRemaining={0}
        physicalRoomRemaining={49000}
        assetRoomRemaining={30000}
      />
    );

    // Verify main labels
    expect(screen.getByText('Cash Room Remaining:')).toBeInTheDocument();
    expect(screen.getByText('Physical Items Room Remaining:')).toBeInTheDocument();
    expect(screen.getByText('Stock/Asset Room Remaining:')).toBeInTheDocument();

    // Verify warning for Cash Room ($0 remaining)
    expect(screen.getByText('Maximized (Excess will trigger a 5-year tax carryover)')).toBeInTheDocument();

    // Verify values for Physical and Stock Room
    expect(screen.getByText('$49,000.00')).toBeInTheDocument();
    expect(screen.getByText('$30,000.00')).toBeInTheDocument();
  });
});
