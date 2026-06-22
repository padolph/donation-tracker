import ReportContainer from './ReportContainer';
import { getReportData } from '@/app/actions/reportActions';

export default async function ReportPage() {
  const currentYear = new Date().getFullYear();
  const result = await getReportData(currentYear);
  const initialData = result.success && result.data ? result.data : { year: currentYear, organizations: [], grandTotal: 0 };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <ReportContainer initialData={initialData} />
    </div>
  );
}
