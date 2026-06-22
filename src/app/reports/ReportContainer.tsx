'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchReportData = async () => {
      if (year === initialData.year && reportData === initialData) return;
      
      setIsLoading(true);
      const result = await getReportData(year);
      if (result.success && result.data) {
        setReportData(result.data);
      }
      setIsLoading(false);
    };

    fetchReportData();
  }, [year, initialData]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold mb-1">Tax Reports</h1>
          <p className="text-white/50 text-sm">Review and export your annual donation data</p>
        </div>
        <YearSelector currentYear={year} onChange={setYear} />
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
