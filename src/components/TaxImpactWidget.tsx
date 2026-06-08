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
  cashRoomRemaining?: number;
  physicalRoomRemaining?: number;
  assetRoomRemaining?: number;
  cashTotal?: number;
  itemsTotal?: number;
  assetsTotal?: number;
  estimatedAGI?: number;
}

export default function TaxImpactWidget({
  taxSavings,
  marginalTaxRate,
  year = new Date().getFullYear(),
  calculationState = 'default',
  floor,
  floorRemaining,
  cashRoomRemaining,
  physicalRoomRemaining,
  assetRoomRemaining,
  cashTotal = 0,
  itemsTotal = 0,
  assetsTotal = 0,
  estimatedAGI = 0,
}: TaxImpactWidgetProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const isObbba = year === 2026 && calculationState !== 'default';
  const showBreakdown = isObbba && (calculationState === 'active' || calculationState === 'max_ceiling');

  const renderHelperText = () => {
    if (isObbba) {
      switch (calculationState) {
        case 'below_floor':
          const floorPercentage = estimatedAGI && estimatedAGI > 0 ? (floor ?? 0) / estimatedAGI : 0.005;
          const formattedPercentage = `${(floorPercentage * 100).toFixed(1)}%`;
          return (
            <p className="text-white/60 text-sm max-w-md">
              You are <span className="text-white font-bold">{formatCurrency(floorRemaining ?? 0)}</span> away from clearing your statutory AGI-based floor ({formattedPercentage}, or {formatCurrency(floor ?? 0)}). Once crossed, your giving will begin unlocking tax savings.
            </p>
          );
        case 'active':
          return (
            <p className="text-white/60 text-sm max-w-md">
              Your donations are actively saving you money!
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

  const renderProgressBar = (room: number, total: number) => {
    const cap = total + room;
    const percentage = cap > 0 ? Math.min(100, (total / cap) * 100) : 100;
    return (
      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1.5">
        <div 
          className="bg-accent h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col gap-1 w-full text-center md:text-left">
        <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-1">
          Estimated Tax Savings
        </h3>
        {renderHelperText()}

        {showBreakdown && (
          <div className="mt-5 space-y-4 w-full max-w-md border-t border-accent/10 pt-4 text-left">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Cash Room Remaining:</span>
                <span className="font-semibold text-white">
                  {cashRoomRemaining === 0 ? '$0.00' : formatCurrency(cashRoomRemaining ?? 0)}
                </span>
              </div>
              <span className={`text-[10px] ${cashRoomRemaining === 0 ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                {cashRoomRemaining === 0 
                  ? 'Maximized (Excess will trigger a 5-year tax carryover)' 
                  : 'Within statutory 60% AGI limit'}
              </span>
              {renderProgressBar(cashRoomRemaining ?? 0, cashTotal)}
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Physical Items Room Remaining:</span>
                <span className="font-semibold text-white">
                  {physicalRoomRemaining === 0 ? '$0.00' : formatCurrency(physicalRoomRemaining ?? 0)}
                </span>
              </div>
              <span className={`text-[10px] ${physicalRoomRemaining === 0 ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                {physicalRoomRemaining === 0 
                  ? 'Maximized (Excess will trigger a 5-year tax carryover)' 
                  : 'Within statutory 50% AGI limit'}
              </span>
              {renderProgressBar(physicalRoomRemaining ?? 0, itemsTotal)}
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Stock/Asset Room Remaining:</span>
                <span className="font-semibold text-white">
                  {assetRoomRemaining === 0 ? '$0.00' : formatCurrency(assetRoomRemaining ?? 0)}
                </span>
              </div>
              <span className={`text-[10px] ${assetRoomRemaining === 0 ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                {assetRoomRemaining === 0 
                  ? 'Maximized (Excess will trigger a 5-year tax carryover)' 
                  : 'Within statutory 30% AGI limit'}
              </span>
              {renderProgressBar(assetRoomRemaining ?? 0, assetsTotal)}
            </div>
          </div>
        )}

        {calculationState === 'below_floor' && isObbba && (
          <div className="mt-5 space-y-4 w-full max-w-md border-t border-accent/10 pt-4 text-left">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Deduction Floor Progress:</span>
                <span className="font-semibold text-white">
                  {formatCurrency(cashTotal + itemsTotal + assetsTotal)} / {formatCurrency(floor ?? 0)}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-medium">
                Donate another {formatCurrency(floorRemaining ?? 0)} to unlock tax savings
              </span>
              {renderProgressBar(floorRemaining ?? 0, cashTotal + itemsTotal + assetsTotal)}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
        <div className="text-5xl font-black text-accent tracking-tighter">
          {formatCurrency(taxSavings)}
        </div>
        <Link 
          href="/settings"
          className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
        >
          ⚙️ Adjust Tax Settings
        </Link>
      </div>
    </div>
  );
}
