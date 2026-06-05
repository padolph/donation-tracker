import { calculateTaxSavings } from '../resolver';

describe('Calculator Strategy Resolver', () => {
  const input = {
    estimatedAGI: 100000,
    marginalTaxRate: 0.32,
    itemsTotal: 1000,
    cashTotal: 1000,
    assetsTotal: 0,
  };

  it('routes to 2026 calculator for 2026 tax year', () => {
    // 2026 calculation: Floor = 500. Total giving = 2000.
    // Savings = (2000 - 500) * 0.32 = 480. State should be active.
    const result = calculateTaxSavings(2026, input);
    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(480);
  });

  it('routes to default calculator for non-2026 tax year', () => {
    // Fallback: 2000 * 0.32 = 640. State should be default.
    const result = calculateTaxSavings(2025, input);
    expect(result.state).toBe('default');
    expect(result.taxSavings).toBe(640);
  });

  it('handles year passed as a string', () => {
    const result = calculateTaxSavings('2026', input);
    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(480);
  });
});
