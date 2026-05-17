import { render, screen, fireEvent } from '@testing-library/react';
import ReportClient from '../ReportClient';
import { YearlyReportData } from '@/app/actions/reportActions';

const mockReportData: YearlyReportData = {
  year: 2025,
  grandTotal: 170,
  organizations: [
    {
      id: 1,
      name: 'Goodwill',
      totalValue: 70,
      donations: [
        {
          id: 1,
          date: new Date('2025-05-10T10:00:00Z'),
          type: 'ITEMS',
          totalValue: 20,
          items: [
            {
              id: 1,
              description: 'T-Shirt',
              category: 'Clothing',
              condition: 'Medium',
              quantity: 2,
              unitValue: 10,
              totalValue: 20,
              valuationMethod: 'Thrift Shop Value',
            },
          ],
        },
      ],
    },
  ],
};

describe('ReportClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ReportClient initialData={mockReportData} />);
    expect(screen.getByText('Goodwill')).toBeInTheDocument();
    expect(screen.getByText('Annual Tax Report: 2025')).toBeInTheDocument();
  });

  it('has print and export buttons', () => {
    render(<ReportClient initialData={mockReportData} />);
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export to csv/i })).toBeInTheDocument();
  });

  it('triggers CSV generation when export button is clicked', () => {
    const createObjectURLMock = jest.fn().mockReturnValue('blob:mock-url');
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = jest.fn();
    
    // Mock anchor tag to prevent actual download/navigation
    const originalCreateElement = document.createElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement.call(document, tagName);
      if (tagName === 'a') {
        jest.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });

    render(<ReportClient initialData={mockReportData} />);

    const exportButton = screen.getByRole('button', { name: /export to csv/i });
    fireEvent.click(exportButton);

    expect(createObjectURLMock).toHaveBeenCalled();
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toBe('text/csv;charset=utf-8;');
  });
});
