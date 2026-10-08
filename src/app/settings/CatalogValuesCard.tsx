'use client';

import { useState } from 'react';
import {
  exportCatalog,
  previewCatalogImport,
  applyCatalogImport,
  type CatalogImportSummary,
} from '@/app/actions/catalogActions';
import type { CatalogChange, CatalogRowError } from '../../../prisma/catalogValues';

interface Preview {
  formData: FormData;
  summary: CatalogImportSummary;
  changes: CatalogChange[];
  errors: CatalogRowError[];
}

function money(value: number | null) {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function describeChange(change: CatalogChange) {
  const next = `${money(change.newHigh)} / ${money(change.newMedium)}`;
  if (change.kind === 'added') return `new · ${next}`;
  return `${money(change.oldHigh)} / ${money(change.oldMedium)} → ${next}`;
}

export default function CatalogValuesCard() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = async () => {
    setMessage(null);
    const result = await exportCatalog();
    if (!result.success) {
      setMessage({ type: 'error', text: result.error });
      return;
    }

    const url = URL.createObjectURL(new Blob([result.csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `item-values-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadPreview = async (formData: FormData) => {
    setBusy(true);
    setMessage(null);
    setPreview(null);
    const result = await previewCatalogImport(formData);
    if (result.success) {
      setPreview({ formData, summary: result.summary, changes: result.changes, errors: result.errors });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setBusy(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    e.target.value = '';
    loadPreview(formData);
  };

  const handleUseBundled = () => {
    const formData = new FormData();
    formData.append('source', 'bundled');
    loadPreview(formData);
  };

  const handleApply = async () => {
    if (!preview) return;
    setBusy(true);
    setMessage(null);
    const result = await applyCatalogImport(preview.formData);
    if (result.success) {
      setPreview(null);
      setMessage({
        type: 'success',
        text: `Catalog updated: ${result.summary.updated} updated, ${result.summary.added} added.`,
      });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setBusy(false);
  };

  const changeCount = preview ? preview.summary.added + preview.summary.updated : 0;

  return (
    <section className="max-w-2xl mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 space-y-6">
      <header>
        <h2 className="text-xl font-bold mb-1">Item Value Catalog</h2>
        <p className="text-white/50 text-xs">
          Update the suggested High and Medium values for catalog items from a CSV file. Past donations keep the
          values they were saved with, and your custom items are never changed. See the user guide for the file
          format.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-widest disabled:opacity-30"
        >
          Download catalog
        </button>
        <button
          type="button"
          onClick={handleUseBundled}
          disabled={busy}
          className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-widest disabled:opacity-30"
        >
          Use bundled values
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="catalog-file-input" className="text-xs font-bold uppercase tracking-widest text-white/40">
          Import values from CSV
        </label>
        <input
          id="catalog-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={busy}
          className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-accent file:text-black hover:file:bg-yellow-500 file:transition-all cursor-pointer disabled:opacity-50"
        />
        {busy && !preview && <p className="text-xs text-white/50 animate-pulse">Checking values...</p>}
      </div>

      {preview && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm space-y-3">
          {changeCount === 0 ? (
            <p className="font-bold text-blue-400">Nothing to change: the catalog already has these values.</p>
          ) : (
            <p className="font-bold text-blue-400">Ready to import:</p>
          )}
          <ul className="text-xs text-white/70 list-disc list-inside space-y-1 pl-1">
            <li>{preview.summary.updated} updated</li>
            <li>{preview.summary.added} added</li>
            <li>{preview.summary.unchanged} unchanged</li>
            {preview.summary.skippedCustom > 0 && (
              <li>{plural(preview.summary.skippedCustom, 'custom item skipped', 'custom items skipped')}</li>
            )}
            {preview.summary.errors > 0 && (
              <li>{plural(preview.summary.errors, 'row with errors skipped', 'rows with errors skipped')}</li>
            )}
          </ul>

          {preview.changes.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <tbody>
                  {preview.changes.map((change) => (
                    <tr key={`${change.category}/${change.description}`} className="border-b border-white/5">
                      <td className="p-2 text-white/80">{change.description}</td>
                      <td className="p-2 text-right font-mono text-white/50 whitespace-nowrap">{describeChange(change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {changeCount > preview.changes.length && (
            <p className="text-xs text-white/40">Showing the first {preview.changes.length} changes.</p>
          )}

          {preview.errors.length > 0 && (
            <ul className="text-xs text-red-400 space-y-1">
              {preview.errors.map((error) => (
                <li key={error.line}>Line {error.line}: {error.message}</li>
              ))}
            </ul>
          )}

          {changeCount > 0 && (
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="w-full mt-2 bg-accent text-black font-black py-3 rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
            >
              {busy ? 'Applying...' : `Apply ${plural(changeCount, 'change', 'changes')}`}
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
