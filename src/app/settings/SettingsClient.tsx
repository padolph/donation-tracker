'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/actions/settingsActions';
import { parseSyncPackage, importSyncPackage } from '@/app/actions/syncActions';

interface Settings {
  id: number;
  marginalTaxRate: number;
  estimatedAGI: number;
  updatedAt: Date;
}

export default function SettingsClient({ 
  initialSettings,
  databasePath,
  storagePath,
}: { 
  initialSettings: Settings;
  databasePath: string;
  storagePath: string;
}) {
  const [taxRate, setTaxRate] = useState<number | ''>(initialSettings.marginalTaxRate * 100);
  const [estimatedAGI, setEstimatedAGI] = useState<number | ''>(initialSettings.estimatedAGI);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const result = await updateSettings({
      marginalTaxRate: taxRate === '' ? 0 : taxRate / 100,
      estimatedAGI: estimatedAGI === '' ? 0 : estimatedAGI,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
    }
    setIsSaving(false);
  };

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
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-white/50 text-sm">Configure application-wide preferences</p>
      </header>

      <form onSubmit={handleSave} className="max-w-2xl space-y-8 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8">
        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="taxRate" className="text-xs font-bold uppercase tracking-widest text-white/40">
              Marginal Tax Rate (%)
            </label>
            <div className="relative max-w-[200px]">
              <input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl font-bold pr-10"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <span className="absolute right-4 top-3 text-white/40">%</span>
            </div>
            <p className="text-xs text-white/30">
              Used to estimate tax savings on the dashboard (e.g., 32% for most individuals).
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-6 border-t border-white/10">
            <label htmlFor="estimatedAGI" className="text-xs font-bold uppercase tracking-widest text-white/40">
              Estimated AGI ($)
            </label>
            <div className="relative max-w-[200px]">
              <input
                id="estimatedAGI"
                type="number"
                min="0"
                step="1"
                className="w-full px-4 py-3 rounded-xl font-bold pr-10"
                value={estimatedAGI}
                onChange={(e) => setEstimatedAGI(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <span className="absolute right-4 top-3 text-white/40">$</span>
            </div>
            <p className="text-xs text-white/30">
              Used to calculate OBBBA compliance floors and ceilings for the 2026+ tax year.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-6 border-t border-white/10">
            <label htmlFor="databasePath" className="text-xs font-bold uppercase tracking-widest text-white/40">
              Database Path
            </label>
            <div className="relative w-full">
              <input
                id="databasePath"
                type="text"
                readOnly
                className="w-full px-4 py-3 rounded-xl font-mono text-xs bg-[#151518] border-[#252528] text-white/30 cursor-not-allowed select-all focus:border-[#252528] focus:ring-0 focus:outline-none"
                value={databasePath}
              />
            </div>
            <p className="text-xs text-white/30">
              The full absolute path to the SQLite database file in use by this application.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-6 border-t border-white/10">
            <label htmlFor="storagePath" className="text-xs font-bold uppercase tracking-widest text-white/40">
              Image Storage Path
            </label>
            <div className="relative w-full">
              <input
                id="storagePath"
                type="text"
                readOnly
                className="w-full px-4 py-3 rounded-xl font-mono text-xs bg-[#151518] border-[#252528] text-white/30 cursor-not-allowed select-all focus:border-[#252528] focus:ring-0 focus:outline-none"
                value={storagePath}
              />
            </div>
            <p className="text-xs text-white/30">
              The full absolute path to the folder where receipt and donation images are stored.
            </p>
          </div>
        </section>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-accent text-black font-black py-4 rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Data Sync Panel */}
      <div className="max-w-2xl mt-8 space-y-8 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8">
        <header>
          <h2 className="text-xl font-bold mb-1">Data Sync</h2>
          <p className="text-white/50 text-xs">Export or import/merge local donation tracker data packages</p>
        </header>

        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Export Package</h3>
            <p className="text-xs text-white/30 mb-2">
              Generate and download a compressed `.dtpack` file containing categories, items, organizations, events, and receipts.
            </p>
            <a
              href="/api/sync/export"
              download
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm uppercase tracking-widest text-center"
            >
              Export Sync Package
            </a>
          </div>

          <div className="flex flex-col gap-2 pt-6 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Import Package</h3>
            <p className="text-xs text-white/30 mb-4">
              Select and import a `.dtpack` file exported from a secondary machine. The engine will merge new records and deduplicate matching entries.
            </p>
            
            <div className="flex flex-col gap-3">
              <label htmlFor="sync-file-input" className="text-xs font-bold uppercase tracking-widest text-white/40">
                Select Sync Package
              </label>
              <input
                id="sync-file-input"
                type="file"
                accept=".dtpack"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 file:transition-all cursor-pointer disabled:opacity-50"
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
        </section>
      </div>
    </div>
  );
}
