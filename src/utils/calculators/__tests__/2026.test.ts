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
    expect(result.assetRoomRemaining).toBe(30000);
    expect(result.physicalRoomRemaining).toBe(50000);
    expect(result.cashRoomRemaining).toBe(59600);
  });

  it('calculates State 2: Active Zone (Floor < Total Giving <= Ceilings)', () => {
    // AGI = 100,000 => Floor = 500
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
    expect(result.assetRoomRemaining).toBe(29000);
    expect(result.physicalRoomRemaining).toBe(48000);
    expect(result.cashRoomRemaining).toBe(57000);
    expect(result.allowedContributionsRemaining).toBe(134000);
  });

  it('applies the 35% benefit cap for 37% marginal rate earners in Active Zone', () => {
    // AGI = 100,000 => Floor = 500
    // Giving: Cash = 1500 => Total = 1500
    // Savings = (1500 - 500) * 0.37 = 370 (under revised rules, we use the Marginal Tax Rate directly)
    const result = calculator2026.calculate({
      ...baseInput,
      marginalTaxRate: 0.37,
      cashTotal: 1500,
    });

    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(370);
  });

  it('calculates State 3: Above the Ceiling (Total Giving > Ceilings)', () => {
    // AGI = 100,000 => Floor = 500
    // Giving: Cash = 15k, Physical = 25k, Stock = 35k
    // Stock Cap: 30% of 100k = 30k (Deducted stock = 30k)
    // Physical Cap: 50% of 100k - 30k = 20k (Deducted physical = 20k)
    // Cash Cap: 60% of 100k - 30k - 20k = 10k (Deducted cash = 10k)
    // Total Allowed: 60k
    // Savings = (75k - 500) * 0.32 = 23,840 (based on total giving)
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 15000,
      itemsTotal: 25000,
      assetsTotal: 35000,
    });

    expect(result.state).toBe('max_ceiling');
    expect(result.taxSavings).toBe(23840);
    expect(result.allowedContributionsRemaining).toBe(0);
    expect(result.assetRoomRemaining).toBe(0);
    expect(result.physicalRoomRemaining).toBe(0);
    expect(result.cashRoomRemaining).toBe(0);
  });

  it('handles partial ceiling maximization (one category hit, other still open)', () => {
    // AGI = 100,000 => Floor = 500
    // Giving: Cash = 70k, Physical = 10k, Assets = 0
    // Stock Cap: 30k (Deducted: 0, Room: 30k)
    // Physical Cap: 50k (Deducted: 10k, Room: 40k)
    // Cash Cap: 60k - 10k = 50k (Deducted: 50k, Room: 0)
    // Total Allowed: 60k
    // Savings = (80k - 500) * 0.32 = 25,440 (based on total giving)
    const result = calculator2026.calculate({
      ...baseInput,
      cashTotal: 70000,
      itemsTotal: 10000,
    });

    expect(result.state).toBe('active');
    expect(result.taxSavings).toBe(25440);
    expect(result.assetRoomRemaining).toBe(30000);
    expect(result.physicalRoomRemaining).toBe(40000);
    expect(result.cashRoomRemaining).toBe(0);
    expect(result.allowedContributionsRemaining).toBe(70000);
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
    expect(result.assetRoomRemaining).toBe(0);
    expect(result.physicalRoomRemaining).toBe(0);
    expect(result.cashRoomRemaining).toBe(0);
  });
});
