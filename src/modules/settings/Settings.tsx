import { SettingsLayout } from './SettingsLayout';

/**
 * Settings page entry. Routing + layout live in SettingsLayout; each section
 * lives in ./sections/* so future developers own one area per file.
 */
export function Settings() {
  return <SettingsLayout />;
}
