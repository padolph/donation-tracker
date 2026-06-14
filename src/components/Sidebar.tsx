'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { version } from '../../package.json';

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
  const [logoSrc, setLogoSrc] = useState('/icon.png');
  const retryRef = useRef(0);

  const handleLogoError = () => {
    if (retryRef.current < 10) {
      retryRef.current += 1;
      const nextRetry = retryRef.current;
      setTimeout(() => {
        setLogoSrc(`/icon.png?retry=${nextRetry}&t=${Date.now()}`);
      }, 1000);
    }
  };

  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-white/10">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative">
            <img
              src={logoSrc}
              alt="DonationTracker Logo"
              onError={handleLogoError}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DonationTracker</h1>
            <p className="text-xs text-white/50">Charitable Giving Tracker</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
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

      <div className="p-6 border-t border-white/10 flex flex-col gap-2">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white/60 hover:bg-white/5 hover:text-white w-full text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>
        <div className="px-4 text-xs text-white/35">
          v{version}
        </div>
      </div>
    </aside>
  );
}
