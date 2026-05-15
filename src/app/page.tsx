import { getDashboardStats } from '@/app/actions/dashboardActions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const { stats, error } = await getDashboardStats(currentYear);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error loading dashboard</h1>
        <p className="text-white/50">{error || 'Please try again later.'}</p>
      </div>
    );
  }

  return <DashboardClient initialStats={stats} />;
}
