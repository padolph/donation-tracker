'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/app/actions/dashboardActions';
import YearSelector from '@/components/YearSelector';
import SummaryCards from '@/components/SummaryCards';
import TaxImpactWidget from '@/components/TaxImpactWidget';

interface DashboardStats {
  totalDonated: number;
  itemsTotal: number;
  cashTotal: number;
  assetsTotal: number;
  organizationCount: number;
  taxSavings: number;
  marginalTaxRate: number;
  estimatedAGI?: number;
  calculationState?: 'below_floor' | 'active' | 'max_ceiling' | 'default';
  floor?: number;
  floorRemaining?: number;
  allowedContributionsRemaining?: number;
  cashRoomRemaining?: number;
  physicalRoomRemaining?: number;
  assetRoomRemaining?: number;
}

export default function DashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const result = await getDashboardStats(year);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
      setIsLoading(false);
    };

    // Only fetch if year is different from initial render (current year)
    // or if we want to ensure data is always fresh when switching back.
    // For now, let's just always fetch when year changes.
    const isInitialYear = year === new Date().getFullYear();
    if (!isInitialYear || stats !== initialStats) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  return (
    <div className={`p-4 sm:p-8 max-w-5xl mx-auto space-y-10 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-white/50 text-sm">Summary and tax impact overview</p>
        </div>
        <YearSelector currentYear={year} onChange={setYear} />
      </header>

      <SummaryCards stats={stats} />

      <section className="pt-4">
        <TaxImpactWidget
          taxSavings={stats.taxSavings}
          marginalTaxRate={stats.marginalTaxRate}
          year={year}
          calculationState={stats.calculationState}
          floor={stats.floor}
          floorRemaining={stats.floorRemaining}
          allowedContributionsRemaining={stats.allowedContributionsRemaining}
          cashRoomRemaining={stats.cashRoomRemaining}
          physicalRoomRemaining={stats.physicalRoomRemaining}
          assetRoomRemaining={stats.assetRoomRemaining}
          cashTotal={stats.cashTotal}
          itemsTotal={stats.itemsTotal}
          assetsTotal={stats.assetsTotal}
          estimatedAGI={stats.estimatedAGI}
        />
      </section>
    </div>
  );
}
