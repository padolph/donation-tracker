import { getSettings } from '@/app/actions/settingsActions';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const { settings, databasePath } = await getSettings();

  if (!settings) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error loading settings</h1>
        <p className="text-white/50">Please try again later.</p>
      </div>
    );
  }

  return <SettingsClient initialSettings={settings} databasePath={databasePath || ''} />;
}
