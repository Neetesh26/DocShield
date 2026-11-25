import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopHeader } from '../components/navigation/TopHeader';

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 print:h-auto print:w-full print:overflow-visible print:bg-white print:block">
      {/* Sidebar - Strictly hidden in print/PDF */}
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden print:h-auto print:w-full print:overflow-visible print:block">
        {/* Top Header - Strictly hidden in print/PDF */}
        <div className="print:hidden shrink-0">
          <TopHeader />
        </div>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 print:p-0 print:m-0 print:overflow-visible print:bg-white print:h-auto print:block">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

