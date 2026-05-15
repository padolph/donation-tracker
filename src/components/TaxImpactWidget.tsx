'use client';

import Link from 'next/link';

interface TaxImpactWidgetProps {
  taxSavings: number;
  marginalTaxRate: number;
}

export default function TaxImpactWidget({ taxSavings, marginalTaxRate }: TaxImpactWidgetProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-1">
          Estimated Tax Savings
        </h3>
        <p className="text-white/60 text-sm max-w-md">
          Based on your configured marginal tax rate of <span className="text-white font-bold">{(marginalTaxRate * 100).toFixed(1)}%</span>. 
          You can adjust this in the settings.
        </p>
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
