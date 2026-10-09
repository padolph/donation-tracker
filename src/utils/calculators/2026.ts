import { TaxCalculator, CalculationInput, CalculationResult } from './types';

// OBBBA high-earner cap (IRC §68 as amended for tax years after 2025): taxpayers in the 37% bracket
// have their itemized deductions reduced by 2/37, so each deducted dollar saves at most 35 cents.
const TOP_BRACKET_RATE = 0.37;
const TOP_BRACKET_DEDUCTION_FACTOR = 35 / 37;

export const calculator2026: TaxCalculator = {
  calculate(input: CalculationInput): CalculationResult {
    const { estimatedAGI, marginalTaxRate, itemsTotal, cashTotal, assetsTotal } = input;

    const floor = estimatedAGI * 0.005;

    // IRS Publication 526 ("Charitable Contributions") - Limits on Deductions:

    // 1. Tier 1 (Stock / Long-Term Appreciated Property): Capped at 30% of AGI.
    // Reference: IRS Pub 526, "Limits on Deductions" - 30% Limit Section / Worksheet 2
    const stockCap = estimatedAGI * 0.3;
    const deductedStock = Math.min(assetsTotal, stockCap);
    const assetRoomRemaining = Math.max(0, stockCap - assetsTotal);

    // 2. Tier 2 (Ordinary Non-Cash / Physical Items): Capped at 50% of AGI, reduced by the long-term property deducted.
    // Reference: IRS Pub 526, "Limits on Deductions" - 50% Limit Section / Worksheet 1 & 2
    const physicalCap = Math.max(0, estimatedAGI * 0.5 - deductedStock);
    const deductedPhysical = Math.min(itemsTotal, physicalCap);
    const physicalRoomRemaining = Math.max(0, physicalCap - itemsTotal);

    // 3. Tier 3 (Cash): Absolute cap of 60% of AGI, reduced by the combined total of stock and physical deducted.
    // Reference: IRS Pub 526, "Limits on Deductions" - 60% Limit Section / Worksheet 1 & 2
    const cashCap = Math.max(0, estimatedAGI * 0.6 - deductedStock - deductedPhysical);
    const deductedCash = Math.min(cashTotal, cashCap);
    const cashRoomRemaining = Math.max(0, cashCap - cashTotal);

    const totalGiving = cashTotal + assetsTotal + itemsTotal;
    const allowedContributionsRemaining = assetRoomRemaining + physicalRoomRemaining + cashRoomRemaining;

    if (totalGiving <= floor) {
      return {
        taxSavings: 0,
        state: 'below_floor',
        floor,
        floorRemaining: floor - totalGiving,
        allowedContributionsRemaining,
        cashRoomRemaining,
        physicalRoomRemaining,
        assetRoomRemaining,
        marginalTaxRate,
        estimatedAGI,
      };
    }

    // Giving above the ceilings is not deductible this year (it carries forward), so it earns no savings.
    const deductibleWithinCeilings = deductedStock + deductedPhysical + deductedCash;
    const eligibleAmount = Math.max(0, Math.min(totalGiving - floor, deductibleWithinCeilings));
    const deductionFactor = marginalTaxRate >= TOP_BRACKET_RATE ? TOP_BRACKET_DEDUCTION_FACTOR : 1;
    const taxSavings = estimatedAGI === 0 ? 0 : eligibleAmount * deductionFactor * marginalTaxRate;

    if (allowedContributionsRemaining === 0) {
      return {
        taxSavings,
        state: 'max_ceiling',
        floor,
        floorRemaining: 0,
        allowedContributionsRemaining: 0,
        cashRoomRemaining: 0,
        physicalRoomRemaining: 0,
        assetRoomRemaining: 0,
        marginalTaxRate,
        estimatedAGI,
      };
    }

    return {
      taxSavings,
      state: 'active',
      floor,
      floorRemaining: 0,
      allowedContributionsRemaining,
      cashRoomRemaining,
      physicalRoomRemaining,
      assetRoomRemaining,
      marginalTaxRate,
      estimatedAGI,
    };
  }
};
