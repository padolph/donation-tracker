'use client';

import { useState, useEffect } from 'react';
import { YearlyReportData, ReportOrganization, ReportDonation, ReportItem } from '@/app/actions/reportActions';

interface ReportClientProps {
  initialData: YearlyReportData;
}

export default function ReportClient({ initialData }: ReportClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Year', 'Organization', 'Date', 'Type', 'Description', 'Category', 'Condition', 'Quantity', 'Unit Value', 'Total Value', 'Valuation Method'];
    const rows: string[][] = [];

    initialData.organizations.forEach((org) => {
      org.donations.forEach((donation) => {
        donation.items.forEach((item) => {
          rows.push([
            initialData.year.toString(),
            org.name,
            new Date(donation.date).toLocaleDateString(),
            donation.type,
            item.description,
            item.category,
            item.condition,
            item.quantity.toString(),
            item.unitValue.toFixed(2),
            item.totalValue.toFixed(2),
            item.valuationMethod,
          ]);
        });
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Donation_Report_${initialData.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Controls - Hidden during print */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Annual Tax Report: {initialData.year}</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-bold"
          >
            <span>📥</span>
            Export to CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors text-sm font-bold"
          >
            <span>🖨️</span>
            Print Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white text-black p-8 rounded-xl shadow-lg print:shadow-none print:p-0">
        <header className="mb-8 border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Donation Tracker</h2>
            <p className="text-sm font-bold text-gray-600">Annual Charitable Contributions Summary</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">{initialData.year}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tax Year</p>
          </div>
        </header>

        <div className="space-y-12">
          {initialData.organizations.map((org) => (
            <section key={org.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline border-b border-gray-200 mb-4">
                <h3 className="text-xl font-bold">{org.name}</h3>
                <p className="text-sm font-bold text-gray-500">
                  Org Total: <span className="text-black ml-2">${org.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>

              <div className="space-y-6">
                {org.donations.map((donation) => (
                  <div key={donation.id} className="ml-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-black bg-gray-100 px-2 py-1 rounded">
                        {new Date(donation.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-bold text-gray-500">
                        Donation Subtotal: ${donation.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-widest">
                          <th className="py-2 w-1/3">Description</th>
                          <th className="py-2">Category</th>
                          <th className="py-2 text-center">Condition</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Value</th>
                          <th className="py-2 text-right">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donation.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 font-medium">{item.description}</td>
                            <td className="py-2 text-gray-600">{item.category}</td>
                            <td className="py-2 text-center">{item.condition}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right font-bold">${item.unitValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2 text-right text-gray-400 italic">{item.valuationMethod}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t-4 border-black flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Report Generated</p>
            <p className="text-sm font-bold">
              {mounted ? `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grand Total for {initialData.year}:</p>
            <p className="text-4xl font-black">${initialData.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
