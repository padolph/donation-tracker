import { calculator2026 } from '../2026';

describe('2026 OBBBA Calculator', () => {
  const baseInput = {
    estimatedAGI: 100000,
    marginalTaxRate: 0.32,
    itemsTotal: 0,
    cashTotal: 0,
    assetsTotal: 0,
  };

  it('calculates State 1: Below the Floor (Total Giving <= Floor)', () => {
    // AGI = 100,000 => Floor = 500
    // Total giving = 400 (<= 500)
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 400,
    });

    expect(result.state).toBe('below_floor');
    expect(result.taxSavings).toBe(0);
    expect(result.floor).toBe(500);
    expect(result.floorRemaining).toBe(100);
  });

  it('calculates State 2: Active Zone (Floor < Total Giving <= Ceilings)', () => {
    // AGI = 100,000 => Floor = 500, CashAssetCap = 60k, PhysicalCap = 30k
    // Giving: Cash = 1000, Assets = 1000, Items = 1000 => Total = 3000
    // Allowed: 3000
    // Savings = (3000 - 500) * 0.32 = 800
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 1000,
      assetsTotal: 1000,
      itemsTotal: 1000,
    });

    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(800);
    expect(result.floor).toBe(500);
    expect(result.allowedContributionsRemaining).toBe(87000); // (60k - 2k) + (30k - 1k)
  });

  it('applies the 35% benefit cap for 37% marginal rate earners in Active Zone', () => {
    // AGI = 100,000 => Floor = 500
    // Giving: Cash = 1500 => Total = 1500
    // Savings = (1500 - 500) * 0.35 = 350 (since rate 37% is capped at 35%)
    const result = calculator2026.calculate({
      ...baseInput,
      marginalTaxRate: 0.37,
      cashTotal: 1500,
    });

    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(350);
  });

  it('calculates State 3: Above the Ceiling (Total Giving > Ceilings)', () => {
    // AGI = 100,000 => Floor = 500, CashAssetCap = 60k, PhysicalCap = 30k
    // Giving: Cash = 70k, Physical = 35k
    // Allowed: CashAsset = 60k, Physical = 30k => Total allowed = 90k
    // Savings = (90k - 500) * 0.32 = 28,640
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 70000,
      itemsTotal: 35000,
    });

    expect(result.state).toBe('max_ceiling');
    expect(result.taxSavings).toBe(28640);
    expect(result.allowedContributionsRemaining).toBe(0);
  });

  it('handles partial ceiling maximization (one category hit, other still open)', () => {
    // AGI = 100,000 => Floor = 500, CashAssetCap = 60k, PhysicalCap = 30k
    // Giving: Cash = 70k, Physical = 10k
    // Allowed: CashAsset = 60k, Physical = 10k => Total allowed = 70k
    // Savings = (70k - 500) * 0.32 = 22,240
    // Headroom remaining: 0 (cash) + 20k (physical) = 20k
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 70000,
      itemsTotal: 10000,
    });

    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(22240);
    expect(result.allowedContributionsRemaining).toBe(20000);
  });

  it('handles AGI = 0 case correctly', () => {
    // AGI = 0 => Floor = 0, Caps = 0
    // Giving: Cash = 100
    // Allowed: 0
    // Savings = 0, state = max_ceiling
    const result = calculator2026.calculate({
      ...baseInput,
      estimatedAGI: 0,
      cashTotal: 100,
    });

    expect(result.state).toBe('max_ceiling');
    expect(result.taxSavings).toBe(0);
    expect(result.allowedContributionsRemaining).toBe(0);
  });
});
