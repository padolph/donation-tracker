'use client';

import { useState } from 'react';
import YearSelector from '@/components/YearSelector';
import ReportClient from './ReportClient';
import { getReportData, YearlyReportData } from '@/app/actions/reportActions';

interface ReportContainerProps {
  initialData: YearlyReportData;
}

export default function ReportContainer({ initialData }: ReportContainerProps) {
  const [year, setYear] = useState(initialData.year);
  const [reportData, setReportData] = useState<YearlyReportData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleYearChange = async (newYear: number) => {
    setYear(newYear);
    if (newYear === initialData.year) {
      setReportData(initialData);
      return;
    }

    setIsLoading(true);
    const result = await getReportData(newYear);
    if (result.success && result.data) {
      setReportData(result.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold mb-1">Tax Reports</h1>
          <p className="text-white/50 text-sm">Review and export your annual donation data</p>
        </div>
        <YearSelector currentYear={year} onChange={handleYearChange} />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        <ReportClient initialData={reportData} />
      )}
    </div>
  );
}
