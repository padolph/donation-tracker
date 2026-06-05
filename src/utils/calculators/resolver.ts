import { CalculationInput, CalculationResult } from './types';
import { defaultCalculator } from './default';
import { calculator2026 } from './2026';

export function calculateTaxSavings(year: number | string, input: CalculationInput): CalculationResult {
  const yearStr = String(year);
  if (yearStr === '2026') {
    return calculator2026.calculate(input);
  }
  return defaultCalculator.calculate(input);
}
export * from './types';
