import { TaxCalculator, CalculationInput, CalculationResult } from './types';

export const calculator2026: TaxCalculator = {
  calculate(input: CalculationInput): CalculationResult {
    const { estimatedAGI, marginalTaxRate, itemsTotal, cashTotal, assetsTotal } = input;

    const floor = estimatedAGI * 0.005;
    const effectiveRate = marginalTaxRate === 0.37 ? 0.35 : marginalTaxRate;

    const cashAssetTotal = cashTotal + assetsTotal;
    const physicalTotal = itemsTotal;

    const cashAssetCap = estimatedAGI * 0.6;
    const physicalCap = estimatedAGI * 0.3;

    const allowedCashAsset = Math.min(cashAssetTotal, cashAssetCap);
    const allowedPhysical = Math.min(physicalTotal, physicalCap);
    const allowedTotal = allowedCashAsset + allowedPhysical;

    const totalGiving = cashTotal + assetsTotal + itemsTotal;

    const remainingCashAsset = Math.max(0, cashAssetCap - cashAssetTotal);
    const remainingPhysical = Math.max(0, physicalCap - physicalTotal);
    const allowedContributionsRemaining = remainingCashAsset + remainingPhysical;

    if (totalGiving <= floor) {
      return {
        taxSavings: 0,
        state: 'below_floor',
        floor,
        floorRemaining: floor - totalGiving,
        allowedContributionsRemaining,
        marginalTaxRate,
        estimatedAGI,
      };
    }

    const eligibleAmount = Math.max(0, allowedTotal - floor);
    const taxSavings = eligibleAmount * effectiveRate;

    if (allowedContributionsRemaining === 0) {
      return {
        taxSavings,
        state: 'max_ceiling',
        floor,
        floorRemaining: 0,
        allowedContributionsRemaining: 0,
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
      marginalTaxRate,
      estimatedAGI,
    };
  }
};
