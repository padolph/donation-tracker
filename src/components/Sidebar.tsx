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
  { name: 'Export/Import', href: '/sync', icon: '🔄' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [logoSrc, setLogoSrc] = useState('/icon.png');
  const [isOpen, setIsOpen] = useState(false);
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
    <aside className="w-full md:w-64 bg-sidebar flex flex-col border-b md:border-b-0 md:border-r border-white/10 shrink-0 md:min-h-screen sticky top-0 z-45">
      {/* Top Header Bar on Mobile, or top header area on Desktop */}
      <div className="p-4 md:p-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-3 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 relative">
            <img
              src={logoSrc}
              alt="DonationTracker Logo"
              onError={handleLogoError}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg leading-none">DonationTracker</h1>
            <p className="text-[10px] md:text-xs text-white/50">Charitable Giving Tracker</p>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Navigation links & user controls container */}
      <div className={`${isOpen ? 'fixed' : 'hidden'} md:relative top-[65px] md:top-0 left-0 right-0 bottom-0 bg-sidebar md:bg-transparent z-30 md:z-auto md:flex flex-1 flex-col justify-between border-t md:border-t-0 border-white/5`}>
        <div className="p-4 md:p-6 pt-2 md:pt-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
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

        <div className="p-4 md:p-6 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white/60 hover:bg-white/5 hover:text-white w-full text-left"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          <div className="px-4 text-xs text-white/35">
            v{version}
          </div>
        </div>
      </div>
    </aside>
  );
}
