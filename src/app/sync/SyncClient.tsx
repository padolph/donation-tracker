'use client';

import { useState } from 'react';
import { parseSyncPackage, importSyncPackage } from '@/app/actions/syncActions';

export default function SyncClient() {
  // Sync state variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    summary?: {
      categories: number;
      items: number;
      organizations: number;
      events: number;
      photos: number;
    };
    error?: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setParseResult(null);
    setImportMessage(null);
    if (!file) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await parseSyncPackage(formData);
    setIsParsing(false);

    if (result.success) {
      setParseResult({
        success: true,
        summary: result.summary,
      });
    } else {
      setParseResult({
        success: false,
        error: result.error || 'Failed to parse sync package',
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    const result = await importSyncPackage(formData);
    setIsImporting(false);

    if (result.success) {
      setImportMessage({ type: 'success', text: 'Data imported successfully!' });
      setParseResult(null);
      setSelectedFile(null);
      
      const fileInput = document.getElementById('sync-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      setImportMessage({ type: 'error', text: result.error || 'Failed to import data' });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Export/Import</h1>
        <p className="text-white/50 text-sm">Export or import/merge local donation tracker data packages</p>
      </header>

      <div className="space-y-8">
        {/* Export Card */}
        <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8">
          <header className="mb-6">
            <h2 className="text-xl font-bold mb-1">Export Package</h2>
            <p className="text-white/50 text-xs">Generate and download a compressed `.dtpack` file package containing donation events and receipts, organizations, and the item database.</p>
          </header>

          <a
            href="/api/sync/export"
            download
            className="inline-flex items-center justify-center bg-accent hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-all text-sm uppercase tracking-widest text-center w-full"
          >
            Export Package
          </a>
        </div>

        {/* Import Card */}
        <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8">
          <header className="mb-6">
            <h2 className="text-xl font-bold mb-1">Import Package</h2>
            <p className="text-white/50 text-xs">Select and import a `.dtpack` file exported from another machine, to merge with the existing database.</p>
          </header>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <label htmlFor="sync-file-input" className="text-xs font-bold uppercase tracking-widest text-white/40">
                Select Package to Import
              </label>
              <input
                id="sync-file-input"
                type="file"
                accept=".dtpack"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-accent file:text-black hover:file:bg-yellow-500 file:transition-all cursor-pointer disabled:opacity-50"
              />
            </div>

            {isParsing && (
              <p className="text-xs text-white/50 mt-2 animate-pulse">Analyzing sync package contents...</p>
            )}

            {parseResult && parseResult.success && parseResult.summary && (
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm space-y-2">
                <p className="font-bold text-blue-400">Ready to import:</p>
                <ul className="text-xs text-white/70 list-disc list-inside space-y-1 pl-1">
                  <li>{parseResult.summary.categories} Categories</li>
                  <li>{parseResult.summary.items} Items</li>
                  <li>{parseResult.summary.organizations} Organizations</li>
                  <li>{parseResult.summary.events} Donation Events</li>
                  <li>{parseResult.summary.photos} Receipt Photos</li>
                </ul>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="w-full mt-2 bg-accent text-black font-black py-3 rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                >
                  {isImporting ? 'Importing...' : 'Confirm Import & Merge'}
                </button>
              </div>
            )}

            {parseResult && !parseResult.success && parseResult.error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {parseResult.error}
              </div>
            )}

            {importMessage && (
              <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${
                importMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {importMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
