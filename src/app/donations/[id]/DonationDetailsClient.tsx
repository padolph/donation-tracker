'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ImageOverlay from '@/components/ImageOverlay';
import { DonationEvent } from '../DonationsClient';

export default function DonationDetailsClient({ donation }: { donation: DonationEvent }) {
  const [overlayImage, setOverlayImage] = useState<{ src: string; alt: string } | null>(null);

  const calculateTotalValue = () => {
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
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    return `/api/photos/${filename}`;
  };

  const totalValue = calculateTotalValue();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header with navigation */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Donation Details</h1>
          <p className="text-white/50 text-sm">Detailed breakdown of this contribution</p>
        </div>
        <Link
          href="/donations"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-bold text-white hover:text-white"
        >
          Back to Ledger
        </Link>
      </header>

      {/* Main card - Dark/glassmorphism theme */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{donation.organization.name}</h2>
            <p className="text-white/55 text-sm">
              Date: {new Date(donation.date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Type</span>
            <span className="text-lg font-bold text-white">{donation.type}</span>
          </div>
        </div>

        {/* Notes if present */}
        {donation.notes && (
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Notes</span>
            <p className="text-white/80 text-sm">{donation.notes}</p>
          </div>
        )}

        {/* Donation Items / Cash / Asset Content */}
        {donation.type === 'ITEMS' && donation.items.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Line Items</h3>
            {/* Scrollable Container with max height and compact style */}
            <div className="max-h-[400px] overflow-y-auto border border-white/10 bg-black/20 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] sticky top-0 backdrop-blur-md">
                    <th className="p-3 text-xs font-bold uppercase tracking-widest text-white/40">Description</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-widest text-white/40 text-center">Qty</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-widest text-white/40 text-center">Condition</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Value (ea.)</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-widest text-white/40 text-right font-black">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {donation.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                      <td className="p-3 font-bold text-white">
                        {item.item.description}
                      </td>
                      <td className="p-3 text-center text-white/60">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-center text-white/60">
                        {item.condition}
                      </td>
                      <td className="p-3 text-right text-white/60">
                        {formatCurrency(item.lockedValue)}
                      </td>
                      <td className="p-3 text-right font-black text-accent">
                        {formatCurrency(item.quantity * item.lockedValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {donation.type === 'ITEMS' && donation.items.length === 0 && (
          <div className="text-white/40 text-sm italic py-4">No line items in this donation.</div>
        )}

        {donation.type === 'CASH' && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Contribution</h3>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <span className="text-white font-bold">Cash Donation</span>
              <span className="text-xl font-black text-accent">{formatCurrency(donation.cashAmount || 0)}</span>
            </div>
          </div>
        )}

        {donation.type === 'ASSETS' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Asset Details</h3>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block text-lg">{donation.assetTicker}</span>
                <span className="text-xs text-white/40">Shares: {donation.assetShares}</span>
              </div>
              <span className="text-xl font-black text-accent">{formatCurrency(donation.cashAmount || 0)}</span>
            </div>
          </div>
        )}

        {/* Attachments / Photos */}
        {donation.photos.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Attachments</h3>
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
                    aria-label={`View ${isPDF ? 'PDF' : 'image'}`}
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

        {/* Footer with totals */}
        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">Total Value:</span>
            <span className="text-3xl font-black text-accent">{formatCurrency(totalValue)}</span>
          </div>
        </div>
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
