'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'All Donations', href: '/donations', icon: '📄' },
  { name: 'Add Donation', href: '/donations/new', icon: '➕' },
  { name: 'Organizations', href: '/organizations', icon: '🏢' },
  { name: 'Tax Reports', href: '/reports', icon: '🧾' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-white/10">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative">
            <img 
              src="/icon.png" 
              alt="DonationTracker Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DonationTracker</h1>
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
      
      <div className="p-6 border-t border-white/10">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white/60 hover:bg-white/5 hover:text-white w-full text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
