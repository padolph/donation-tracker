import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogValuesCard from '../CatalogValuesCard';
import { exportCatalog, previewCatalogImport, applyCatalogImport } from '@/app/actions/catalogActions';

jest.mock('@/app/actions/catalogActions', () => ({
  exportCatalog: jest.fn(),
  previewCatalogImport: jest.fn(),
  applyCatalogImport: jest.fn(),
}));

const mockExport = exportCatalog as jest.Mock;
const mockPreview = previewCatalogImport as jest.Mock;
const mockApply = applyCatalogImport as jest.Mock;

const preview = {
  success: true,
  summary: { added: 1, updated: 2, unchanged: 30, skippedCustom: 1, errors: 1 },
  changes: [
    { kind: 'updated', itemId: 10, category: 'Kitchen', description: 'Kitchen: Pan', leafName: 'Pan', oldHigh: 10, oldMedium: 5, newHigh: 12, newMedium: 6 },
    { kind: 'added', category: 'Garden', description: 'Garden: Rake', leafName: 'Rake', oldHigh: null, oldMedium: null, newHigh: 7, newMedium: null },
  ],
  errors: [{ line: 4, message: 'High Quality Value "oops" is not a valid amount' }],
};

function chooseFile(name = 'values.csv') {
  const file = new File(['csv'], name, { type: 'text/csv' });
  fireEvent.change(screen.getByLabelText(/Import values from CSV/i), { target: { files: [file] } });
  return file;
}

describe('CatalogValuesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('downloads the current catalog as a CSV file', async () => {
    mockExport.mockResolvedValue({ success: true, csv: 'a,b\n' });
    const createObjectURL = jest.fn(() => 'blob:catalog');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<CatalogValuesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Download catalog/i }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^item-values-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:catalog');
    click.mockRestore();
  });

  it('shows an export error', async () => {
    mockExport.mockResolvedValue({ success: false, error: 'boom' });
    render(<CatalogValuesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Download catalog/i }));
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  it('previews a chosen file before anything is applied', async () => {
    mockPreview.mockResolvedValue(preview);
    render(<CatalogValuesCard />);

    const file = chooseFile();

    expect(await screen.findByText('2 updated')).toBeInTheDocument();
    const formData = mockPreview.mock.calls[0][0] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(screen.getByText('1 added')).toBeInTheDocument();
    expect(screen.getByText('30 unchanged')).toBeInTheDocument();
    expect(screen.getByText('1 custom item skipped')).toBeInTheDocument();
    expect(screen.getByText('1 row with errors skipped')).toBeInTheDocument();
    expect(screen.getByText('Kitchen: Pan')).toBeInTheDocument();
    expect(screen.getByText('$10.00 / $5.00 → $12.00 / $6.00')).toBeInTheDocument();
    expect(screen.getByText('new · $7.00 / —')).toBeInTheDocument();
    expect(screen.getByText(/Line 4: High Quality Value "oops" is not a valid amount/)).toBeInTheDocument();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('applies the previewed file and reports the result', async () => {
    mockPreview.mockResolvedValue(preview);
    mockApply.mockResolvedValue({ success: true, summary: preview.summary });
    render(<CatalogValuesCard />);

    const file = chooseFile();
    fireEvent.click(await screen.findByRole('button', { name: /Apply 3 changes/i }));

    expect(await screen.findByText('Catalog updated: 2 updated, 1 added.')).toBeInTheDocument();
    expect((mockApply.mock.calls[0][0] as FormData).get('file')).toBe(file);
    expect(screen.queryByRole('button', { name: /Apply/i })).not.toBeInTheDocument();
  });

  it('previews and applies the values bundled with the app', async () => {
    mockPreview.mockResolvedValue(preview);
    mockApply.mockResolvedValue({ success: true, summary: preview.summary });
    render(<CatalogValuesCard />);

    fireEvent.click(screen.getByRole('button', { name: /Use bundled values/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Apply 3 changes/i }));

    await screen.findByText(/Catalog updated/);
    expect((mockPreview.mock.calls[0][0] as FormData).get('source')).toBe('bundled');
    expect((mockApply.mock.calls[0][0] as FormData).get('source')).toBe('bundled');
  });

  it('says so when there is nothing to change', async () => {
    mockPreview.mockResolvedValue({
      success: true,
      summary: { added: 0, updated: 0, unchanged: 30, skippedCustom: 0, errors: 0 },
      changes: [],
      errors: [],
    });
    render(<CatalogValuesCard />);

    chooseFile();

    expect(await screen.findByText('Nothing to change: the catalog already has these values.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Apply/i })).not.toBeInTheDocument();
  });

  it('shows a preview error', async () => {
    mockPreview.mockResolvedValue({ success: false, error: 'Please choose a .csv file' });
    render(<CatalogValuesCard />);

    chooseFile('values.xlsx');

    expect(await screen.findByText('Please choose a .csv file')).toBeInTheDocument();
  });

  it('shows an apply error and keeps the preview', async () => {
    mockPreview.mockResolvedValue(preview);
    mockApply.mockResolvedValue({ success: false, error: 'disk full' });
    render(<CatalogValuesCard />);

    chooseFile();
    fireEvent.click(await screen.findByRole('button', { name: /Apply 3 changes/i }));

    expect(await screen.findByText('disk full')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply 3 changes/i })).toBeInTheDocument();
  });
});
