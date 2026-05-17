import { render, screen } from '@testing-library/react';
import ReportPage from '../page';
import { getReportData } from '@/app/actions/reportActions';

jest.mock('@/app/actions/reportActions', () => ({
  getReportData: jest.fn(),
}));

jest.mock('../ReportContainer', () => {
  return function DummyReportContainer({ initialData }: any) {
    return <div data-testid="report-container">{initialData.year}</div>;
  };
});

describe('ReportPage', () => {
  it('fetches initial data and renders ReportContainer', async () => {
    const currentYear = new Date().getFullYear();
    (getReportData as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: { year: currentYear, organizations: [], grandTotal: 0 } 
    });

    const Page = await ReportPage();
    render(Page);

    expect(getReportData).toHaveBeenCalledWith(currentYear);
    expect(screen.getByTestId('report-container')).toHaveTextContent(currentYear.toString());
  });
});
