'use client';

import Link from 'next/link';

interface TaxImpactWidgetProps {
  taxSavings: number;
  marginalTaxRate: number;
  year?: number;
  calculationState?: 'below_floor' | 'active' | 'max_ceiling' | 'default';
  floor?: number;
  floorRemaining?: number;
  allowedContributionsRemaining?: number;
}

export default function TaxImpactWidget({
  taxSavings,
  marginalTaxRate,
  year = new Date().getFullYear(),
  calculationState = 'default',
  floor,
  floorRemaining,
  allowedContributionsRemaining,
}: TaxImpactWidgetProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const isObbba = year === 2026 && calculationState !== 'default';

  const renderHelperText = () => {
    if (isObbba) {
      switch (calculationState) {
        case 'below_floor':
          return (
            <p className="text-white/60 text-sm max-w-md">
              You are <span className="text-white font-bold">{formatCurrency(floorRemaining ?? 0)}</span> away from clearing your statutory 2026 0.5% AGI floor ({formatCurrency(floor ?? 0)}). Once crossed, your giving will begin unlocking tax savings.
            </p>
          );
        case 'active':
          return (
            <p className="text-white/60 text-sm max-w-md">
              Your donations are actively saving you money! You can log another <span className="text-white font-bold">{formatCurrency(allowedContributionsRemaining ?? 0)}</span> in contributions before hitting your annual AGI deduction limit.
            </p>
          );
        case 'max_ceiling':
          return (
            <p className="text-white/60 text-sm max-w-md">
              You have fully maximized your allowable 2026 deductions. Remaining tracked balances will carry forward as future tax assets.
            </p>
          );
      }
    }

    return (
      <p className="text-white/60 text-sm max-w-md">
        Based on your configured marginal tax rate of <span className="text-white font-bold">{(marginalTaxRate * 100).toFixed(1)}%</span>. 
        You can adjust this in the settings.
      </p>
    );
  };

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-1">
          Estimated Tax Savings
        </h3>
        {renderHelperText()}
      </div>

      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="text-5xl font-black text-accent tracking-tighter">
          {formatCurrency(taxSavings)}
        </div>
        <Link 
          href="/settings"
          className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
        >
          ⚙️ Adjust Tax Rate
        </Link>
      </div>
    </div>
  );
}
