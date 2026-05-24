/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ReportContainer from '../ReportContainer';
import { getReportData, YearlyReportData } from '@/app/actions/reportActions';

jest.mock('@/app/actions/reportActions', () => ({
  getReportData: jest.fn(),
}));

jest.mock('../ReportClient', () => {
  return function DummyReportClient({ initialData }: any) {
    return <div data-testid="report-client">{initialData.year}</div>;
  };
});

// Mock YearSelector to simplify testing
jest.mock('@/components/YearSelector', () => {
  return function DummyYearSelector({ currentYear, onChange }: any) {
    return (
      <select
        data-testid="year-selector"
        value={currentYear}
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        <option value={2025}>2025</option>
        <option value={2026}>2026</option>
      </select>
    );
  };
});

const mockInitialData: YearlyReportData = {
  year: 2026,
  grandTotal: 0,
  organizations: [],
};

describe('ReportContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial data correctly', () => {
    render(<ReportContainer initialData={mockInitialData} />);
    expect(screen.getByTestId('report-client')).toHaveTextContent('2026');
  });

  it('fetches new data when year changes', async () => {
    const newData: YearlyReportData = {
      year: 2025,
      grandTotal: 100,
      organizations: [],
    };
    (getReportData as jest.Mock).mockResolvedValue({ success: true, data: newData });

    render(<ReportContainer initialData={mockInitialData} />);

    const yearSelector = screen.getByTestId('year-selector');
    
    await act(async () => {
      fireEvent.change(yearSelector, { target: { value: '2025' } });
    });

    await waitFor(() => {
      expect(getReportData).toHaveBeenCalledWith(2025);
    });

    expect(screen.getByTestId('report-client')).toHaveTextContent('2025');
  });
});
