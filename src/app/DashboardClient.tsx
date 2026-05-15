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
    <div className={`p-8 max-w-5xl mx-auto space-y-10 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black mb-1 tracking-tight">Dashboard</h1>
          <p className="text-white/50 text-sm">Giving summary and tax impact overview</p>
        </div>
        <YearSelector currentYear={year} onChange={setYear} />
      </header>

      <SummaryCards stats={stats} />

      <section className="pt-4">
        <TaxImpactWidget taxSavings={stats.taxSavings} marginalTaxRate={stats.marginalTaxRate} />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-64 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-4">📈</span>
          <h3 className="font-bold text-white/80 mb-2">Monthly Trends</h3>
          <p className="text-sm text-white/40 max-w-[200px]">Visual trends coming in a future update.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-64 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-4">🏆</span>
          <h3 className="font-bold text-white/80 mb-2">Top Organizations</h3>
          <p className="text-sm text-white/40 max-w-[200px]">Your most supported causes will appear here.</p>
        </div>
      </div>
    </div>
  );
}
