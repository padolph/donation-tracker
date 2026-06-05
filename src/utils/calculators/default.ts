import { TaxCalculator, CalculationInput, CalculationResult } from './types';

export const defaultCalculator: TaxCalculator = {
  calculate(input: CalculationInput): CalculationResult {
    const totalDonated = input.itemsTotal + input.cashTotal + input.assetsTotal;
    const taxSavings = totalDonated * input.marginalTaxRate;
    return {
      taxSavings,
      state: 'default',
      marginalTaxRate: input.marginalTaxRate,
      estimatedAGI: input.estimatedAGI,
    };
  }
};
