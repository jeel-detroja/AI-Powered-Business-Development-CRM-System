import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white border-r border-gray-200`}
      >
        <Sidebar collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-white border-r border-gray-200">
            <Sidebar collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

