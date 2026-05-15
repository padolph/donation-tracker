'use client';

interface DashboardStats {
  totalDonated: number;
  itemsTotal: number;
  cashTotal: number;
  assetsTotal: number;
  organizationCount: number;
}

export default function SummaryCards({ stats }: { stats: DashboardStats }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const cards = [
    {
      label: 'Total Donated',
      value: formatCurrency(stats.totalDonated),
      icon: '📊',
      color: 'text-accent',
    },
    {
      label: 'Physical Items',
      value: formatCurrency(stats.itemsTotal),
      icon: '📦',
      color: 'text-white',
    },
    {
      label: 'Cash & Assets',
      value: formatCurrency(stats.cashTotal + stats.assetsTotal),
      icon: '💰',
      color: 'text-white',
    },
    {
      label: 'Orgs Supported',
      value: stats.organizationCount.toString(),
      icon: '🏢',
      color: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-1"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              {card.label}
            </span>
            <span className="text-xl">{card.icon}</span>
          </div>
          <div className={`text-2xl font-black ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
