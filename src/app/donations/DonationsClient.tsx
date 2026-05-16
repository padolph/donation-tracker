'use client';

import React, { useState, useEffect } from 'react';
import { getDonations, deleteDonation } from '@/app/actions/donationActions';
import Link from 'next/link';
import ImageOverlay from '@/components/ImageOverlay';

export interface DonationEvent {
  id: number;
  date: Date | string;
  organizationId: number;
  type: string;
  cashAmount: number | null;
  assetTicker: string | null;
  assetShares: number | null;
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
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [overlayImage, setOverlayImage] = useState<{ src: string, alt: string } | null>(null);

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

  const toggleRow = (id: number) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
    }
  };

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
    return 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getPhotoUrl = (filePath: string) => {
    // Extract filename from the stored absolute path
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    return `/api/photos/${filename}`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Date</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Organization</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Type</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Total Value</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
              <th className="p-4"><span className="sr-only">Expand</span></th>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-white/40">
                  No donations found for the selected filters.
                </td>
              </tr>
            ) : (
              donations.map((donation) => {
                const isExpanded = expandedRowId === donation.id;
                return (
                  <React.Fragment key={donation.id}>
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleRow(donation.id)}>
                      <td className="p-4 font-bold text-white">
                        {new Date(donation.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm text-white/60">
                        {donation.organization.name}
                      </td>
                      <td className="p-4 text-sm text-white/60">
                        {donation.type}
                      </td>
                      <td className="p-4 text-right font-black text-accent">
                        {formatCurrency(calculateTotalValue(donation))}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/donations/${donation.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition-colors inline-block"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(donation.id, new Date(donation.date).toLocaleDateString());
                          }}
                          className="text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/20 px-3 py-1 bg-red-500/10 rounded-lg transition-colors inline-block"
                        >
                          Delete
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(donation.id);
                          }}
                          className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition-colors whitespace-nowrap"
                          aria-label="Expand"
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-white/5 border-b border-white/10">
                        <td colSpan={6} className="p-6">
                          {donation.type === 'ITEMS' && donation.items.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Line Items</h4>
                              <div className="space-y-2">
                                {donation.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                    <div>
                                      <span className="font-bold text-white block">{item.item.description}</span>
                                      <span className="text-xs text-white/40">Qty: {item.quantity} · Condition: {item.condition}</span>
                                    </div>
                                    <span className="font-black text-accent">{formatCurrency(item.lockedValue)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {donation.type === 'ASSETS' && (
                            <div className="mb-6">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Asset Details</h4>
                              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <div>
                                  <span className="font-bold text-white block">{donation.assetTicker}</span>
                                  <span className="text-xs text-white/40">Shares: {donation.assetShares}</span>
                                </div>
                                <span className="font-black text-accent">{formatCurrency(donation.cashAmount || 0)}</span>
                              </div>
                            </div>
                          )}
                          {donation.photos.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Attachments</h4>
                              <div className="flex gap-4 flex-wrap">
                                {donation.photos.map((photo, idx) => {
                                  const url = getPhotoUrl(photo.filePath);
                                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(photo.filePath);
                                  const isPDF = /\.pdf$/i.test(photo.filePath);
                                  const isViewable = isImage || isPDF;
                                  
                                  return (
                                    <button 
                                      key={idx} 
                                      onClick={() => isViewable && setOverlayImage({ src: url, alt: `Attachment ${idx + 1}` })}
                                      className={`group relative w-24 h-24 bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all hover:border-white/20 ${isViewable ? 'cursor-zoom-in' : 'cursor-default'}`}
                                      aria-label={isViewable ? `View ${isPDF ? 'PDF' : 'image'}` : "Attachment"}
                                    >
                                      {isImage ? (
                                        <>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img 
                                            src={url} 
                                            alt={`Attachment ${idx + 1}`} 
                                            className="w-full h-full object-cover"
                                          />
                                        </>
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                          <span className="text-3xl mb-1">{isPDF ? '📄' : '📎'}</span>
                                          {isPDF && <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">PDF</span>}
                                          {!isPDF && <span className="text-[8px] text-white/40 break-all">{photo.filePath.split(/[/\\]/).pop()}</span>}
                                        </div>
                                      )}
                                      {isViewable && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-xl">🔍</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {(donation.type !== 'ITEMS' || donation.items.length === 0) && donation.photos.length === 0 && (
                            <div className="text-white/40 text-sm italic">No additional details or attachments.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {overlayImage && (
        <ImageOverlay 
          src={overlayImage.src} 
          alt={overlayImage.alt} 
          onClose={() => setOverlayImage(null)} 
        />
      )}
    </div>
  );
}
