import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../ui/Toast';
import { PageSkeleton } from '../ui/Skeleton';
import { cn } from '../../utils/cn';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="h-screen flex flex-col font-sans text-[#132A4A] overflow-hidden">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />
          {/* Main scroll region — grows to fill the 1920px workspace */}
          <main className={cn('flex-1 min-w-0 overflow-y-auto')}>
            <div className="content-width py-5 lg:py-6">
              <div className="page-stack">
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
