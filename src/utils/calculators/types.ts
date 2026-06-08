export interface CalculationInput {
  estimatedAGI: number;
  marginalTaxRate: number;
  itemsTotal: number;
  cashTotal: number;
  assetsTotal: number;
}

export interface CalculationResult {
  taxSavings: number;
  state: 'below_floor' | 'active' | 'max_ceiling' | 'default';
  floor?: number;
  floorRemaining?: number;
  allowedContributionsRemaining?: number;
  cashRoomRemaining?: number;
  physicalRoomRemaining?: number;
  assetRoomRemaining?: number;
  marginalTaxRate: number;
  estimatedAGI?: number;
}

export interface TaxCalculator {
  calculate(input: CalculationInput): CalculationResult;
}
