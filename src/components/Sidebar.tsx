'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'All Donations', href: '/donations', icon: '📄' },
  { name: 'Add Donation', href: '/donations/new', icon: '➕' },
  { name: 'Organizations', href: '/organizations', icon: '🏢' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-white/10">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-black text-xl font-bold">
            ♡
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DonationTrack</h1>
            <p className="text-xs text-white/50">Tax Deduction Tracker</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">Need help?</p>
          <p className="text-xs text-white/80 leading-relaxed">
            Track your charitable donations for tax deductions
          </p>
        </div>
      </div>
    </aside>
  );
}
