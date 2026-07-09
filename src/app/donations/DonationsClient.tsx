'use client';

import React, { useState, useEffect } from 'react';
import { getDonations, deleteDonation } from '@/app/actions/donationActions';
import Link from 'next/link';

export interface DonationEvent {
  id: number;
  date: Date | string;
  organizationId: number;
  type: string;
  cashAmount: number | null;
  assetTicker: string | null;
  assetShares: number | null;
  milesDriven?: number | null;
  parkingAndTolls?: number | null;
  mileageRate?: number | null;
  notes?: string | null;
  organization: { id: number; name: string };
  items: Array<{
    id: number;
    quantity: number;
    condition: string;
    lockedValue: number;
    item: { id: number; description: string };
  }>;
  photos: Array<{ filePath: string }>;
}

interface Organization {
  id: number;
  name: string;
}

export default function DonationsClient({
  initialDonations,
  organizations,
}: {
  initialDonations: DonationEvent[];
  organizations: Organization[];
}) {
  const [donations, setDonations] = useState<DonationEvent[]>(initialDonations);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [orgFilter, setOrgFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchFiltered = async () => {
      setIsLoading(true);
      const filter: { year?: number; organizationId?: number } = {};
      if (yearFilter) filter.year = parseInt(yearFilter, 10);
      if (orgFilter) filter.organizationId = parseInt(orgFilter, 10);

      const result = await getDonations(filter);
      if (result.success && result.donations) {
        setDonations(result.donations as unknown as DonationEvent[]);
      } else {
        console.error(result.error);
      }
      setIsLoading(false);
    };

    fetchFiltered();
  }, [yearFilter, orgFilter]);

  const handleDelete = async (id: number, dateStr: string) => {
    if (window.confirm(`Are you sure you want to delete the donation from ${dateStr}? This action cannot be undone.`)) {
      const result = await deleteDonation(id);
      if (result.success) {
        setDonations(donations.filter(d => d.id !== id));
      } else {
        alert(result.error || 'Failed to delete donation.');
      }
    }
  };

  const calculateTotalValue = (donation: DonationEvent) => {
    if (donation.type === 'CASH' || donation.type === 'ASSETS') return donation.cashAmount || 0;
    if (donation.type === 'ITEMS') {
      return donation.items.reduce((total, item) => total + item.quantity * item.lockedValue, 0);
    }
    if (donation.type === 'MILEAGE') {
      return (donation.milesDriven || 0) * (donation.mileageRate || 0.14) + (donation.parkingAndTolls || 0);
    }
    return 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };


  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Donation Ledger</h1>
        <p className="text-white/50 text-sm">Review your past donation events</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="space-y-2 flex-1">
          <label htmlFor="year-filter" className="text-[10px] font-black uppercase tracking-widest text-white/40">Filter by Year</label>
          <select
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
          >
            <option value="">All Years</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
            {!years.includes(2025) && <option value="2025">2025</option>}
          </select>
        </div>
        <div className="space-y-2 flex-1">
          <label htmlFor="org-filter" className="text-[10px] font-black uppercase tracking-widest text-white/40">Filter by Organization</label>
          <select
            id="org-filter"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id.toString()}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <table className="w-full text-left border-collapse block md:table">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] hidden md:table-row">
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Date</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Organization</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Type</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Total Value</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
              <th className="p-4 hidden md:table-cell"><span className="sr-only">Expand</span></th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {donations.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={6} className="p-8 text-center text-white/40 block md:table-cell">
                  No donations found for the selected filters.
                </td>
              </tr>
            ) : (
              donations.map((donation) => {
                return (
                  <tr key={donation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors block md:table-row p-4 md:p-0">
                    <td className="p-2 md:p-4 font-bold text-white block md:table-cell before:content-['Date:'] before:block before:md:hidden before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-white/40 before:mb-1">
                      {new Date(donation.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                    </td>
                    <td className="p-2 md:p-4 text-sm text-white/60 block md:table-cell before:content-['Organization:'] before:block before:md:hidden before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-white/40 before:mb-1">
                      {donation.organization.name}
                    </td>
                    <td className="p-2 md:p-4 text-sm text-white/60 block md:table-cell before:content-['Type:'] before:block before:md:hidden before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-white/40 before:mb-1">
                      {donation.type}
                    </td>
                    <td className="p-2 md:p-4 text-left md:text-right font-black text-accent block md:table-cell before:content-['Total_Value:'] before:block before:md:hidden before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-white/40 before:mb-1">
                      {formatCurrency(calculateTotalValue(donation))}
                    </td>
                    <td className="p-2 md:p-4 text-left md:text-right whitespace-nowrap block md:table-cell before:content-['Actions:'] before:block before:md:hidden before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-white/40 before:mb-1">
                      <button
                        onClick={() => handleDelete(donation.id, new Date(donation.date).toLocaleDateString(undefined, { timeZone: 'UTC' }))}
                        className="text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/20 px-3 py-1 bg-red-500/10 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="p-2 md:p-4 text-left md:text-right block md:table-cell">
                      <Link
                        href={`/donations/${donation.id}`}
                        className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition-colors whitespace-nowrap inline-block"
                        aria-label="Expand"
                      >
                        Expand
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
