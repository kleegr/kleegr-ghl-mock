import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SettingsSidebar } from '@/modules/settings/SettingsSidebar';
import { TopBar } from './TopBar';
import { DemoDisclaimer } from './DemoDisclaimer';
import { Toaster } from '@/components/ui/Modal';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { HelpProvider } from '@/components/help';
import { GlobalDialer } from './GlobalDialer';
import { cx } from '@/utils';

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  const { pathname } = useLocation();
  // Inside Settings, the whole left rail becomes the settings menu (matching the
  // live GHL portal) so Settings reads as a separate area, not just another page.
  const inSettings = pathname === '/settings' || pathname.startsWith('/settings/');
  const Rail = inSettings ? SettingsSidebar : Sidebar;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Rail />
      </div>

      {/* Mobile drawer */}
      <div className={cx('fixed inset-0 z-40 lg:hidden', mobileNav ? '' : 'pointer-events-none')}>
        <div className={cx('absolute inset-0 bg-ink/40 transition-opacity', mobileNav ? 'opacity-100' : 'opacity-0')} onClick={() => setMobileNav(false)} />
        <div className={cx('absolute left-0 top-0 h-full transition-transform duration-200', mobileNav ? 'translate-x-0' : '-translate-x-full')}>
          <Rail onNavigate={() => setMobileNav(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNav(true)} />
        <DemoDisclaimer />
        <main className="flex-1 overflow-y-auto bg-surface-sunken">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <TutorialOverlay />
      <HelpProvider />
      <GlobalDialer />
    </div>
  );
}
