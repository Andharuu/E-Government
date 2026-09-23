import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, History, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const { user, logout, isExtensionConnected } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/activity', label: 'Activity', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const currentNavItem = navItems.find(item => item.path === location.pathname);
  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-surface-base text-content-primary font-sans">
      <div className="flex">
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface-elevated focus:text-content-primary focus:rounded-md focus:shadow-lg focus:border focus:border-border-default focus:outline-none"
        >
          Skip to main content
        </a>
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 border-r border-border-default bg-surface-elevated transition-[width] duration-slow ease-layout ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Brand Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border-default">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                {!collapsed && (
                  <div>
                    <span className="font-bold text-content-primary tracking-tight text-base block">
                      GovConnect
                    </span>
                    <span className="text-[10px] text-content-tertiary block leading-tight font-medium">
                      E-Gov Autofill Assistant
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-md text-content-tertiary hover:text-content-secondary hover:bg-surface-sunken transition-colors-fast"
                aria-label={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-normal ease-responsive ${collapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors-fast text-sm font-medium ${
                      isActive
                        ? 'bg-accent-light text-brand-600 font-semibold'
                        : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>

            {/* Extension Quick Status in Sidebar (when expanded) */}
            {!collapsed && (
              <div className="mx-3 mb-3 p-3 bg-surface-sunken border border-border-default rounded-md">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isExtensionConnected ? 'bg-success animate-pulse' : 'bg-brand-500'}`} />
                  <span className="text-xs font-semibold text-content-secondary">
                    {isExtensionConnected ? 'Extension Terhubung' : 'Extension Siap'}
                  </span>
                </div>
                <p className="text-[11px] text-content-tertiary mt-1 leading-tight">
                  {isExtensionConnected
                    ? 'Autofill & analitik tersinkron secara real-time.'
                    : 'Buka popup ekstensi untuk sinkronisasi otomatis.'}
                </p>
              </div>
            )}

            {/* Logout button */}
            <div className="p-3 border-t border-border-default">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-content-secondary hover:bg-red-50 hover:text-error transition-colors-fast text-sm font-medium"
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-[margin-left] duration-slow ease-layout ${collapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 h-16 bg-surface-elevated/95 backdrop-blur-sm border-b border-border-default px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-content-primary">
                {currentNavItem?.label || 'GovConnect'}
              </h1>
            </div>

            {/* Header Right Badges */}
            <div className="flex items-center gap-4">
              {/* Extension Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border ${
                  isExtensionConnected
                    ? 'bg-success-light text-success-dark border-success/30'
                    : 'bg-accent-light text-brand-600 border-brand-500/30'
                }`}
                title={isExtensionConnected ? 'Ekstensi aktif dan tersinkronisasi' : 'Ekstensi siap digunakan'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isExtensionConnected ? 'bg-success' : 'bg-brand-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isExtensionConnected ? 'Ekstensi Terhubung' : 'Ekstensi Terpasang'}
                </span>
              </div>

              {/* User Avatar Chip */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-border-default">
                <div className="w-8 h-8 rounded-full bg-accent-light text-brand-600 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <span className="text-xs font-semibold text-content-primary block truncate max-w-[140px]">
                    {user?.email}
                  </span>
                  <span className="text-[10px] text-content-tertiary">Warga Terverifikasi</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content Body */}
          <main id="main-content" className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
