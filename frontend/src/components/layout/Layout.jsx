import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Toast from '../common/Toast.jsx';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Safety net beyond Sidebar's per-link onClick: closes the drawer on any
  // route change, including browser back/forward, not just a direct sidebar
  // click. Harmless no-op at lg+ where the sidebar is always visible anyway.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-surface-page">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}


