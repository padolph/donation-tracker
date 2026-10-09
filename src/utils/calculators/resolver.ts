import { CalculationInput, CalculationResult } from './types';
import { defaultCalculator } from './default';
import { calculator2026 } from './2026';

// OBBBA rules (0.5% AGI floor and cascading ceilings) take effect in tax year 2026.
const OBBBA_FIRST_YEAR = 2026;

export function calculateTaxSavings(year: number | string, input: CalculationInput): CalculationResult {
  if (Number(year) >= OBBBA_FIRST_YEAR) {
    return calculator2026.calculate(input);
  }
  return defaultCalculator.calculate(input);
}
export * from './types';
