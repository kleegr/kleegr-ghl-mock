import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toaster } from '@/components/ui/Modal';
import { cx } from '@/utils';

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <div className={cx('fixed inset-0 z-40 lg:hidden', mobileNav ? '' : 'pointer-events-none')}>
        <div className={cx('absolute inset-0 bg-ink/40 transition-opacity', mobileNav ? 'opacity-100' : 'opacity-0')} onClick={() => setMobileNav(false)} />
        <div className={cx('absolute left-0 top-0 h-full transition-transform duration-200', mobileNav ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar onNavigate={() => setMobileNav(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNav(true)} />
        <main className="flex-1 overflow-y-auto bg-surface-sunken">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
