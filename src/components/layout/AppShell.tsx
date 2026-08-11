import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../ui/Toast';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F5F7FA] text-[#172B4D] flex flex-col font-sans">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="flex flex-1 min-h-0">
          <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="content-width py-5 lg:py-8">
              <div className="page-stack">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
