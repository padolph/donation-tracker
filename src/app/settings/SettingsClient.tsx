'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/actions/settingsActions';

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
                onFocus={(e) => e.target.select()}
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
                onFocus={(e) => e.target.select()}
              />
              <span className="absolute right-4 top-3 text-white/40">$</span>
            </div>
            <p className="text-xs text-white/30">
              Used to calculate OBBBA compliance floors and ceilings for the 2026+ tax year.
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
      {/* System Information Card */}
      <div className="max-w-2xl mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 text-white/50 text-xs space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">System Information</h2>
        <p>
          <span className="font-bold">Database Path:</span> <code className="font-mono break-all">{databasePath}</code>
        </p>
        <p>
          <span className="font-bold">Image Storage Path:</span> <code className="font-mono break-all">{storagePath}</code>
        </p>
      </div>
    </div>
  );
}
