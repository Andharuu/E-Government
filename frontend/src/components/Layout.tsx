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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 bg-white border-r border-slate-200 ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Brand Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  G
                </div>
                {!collapsed && (
                  <div>
                    <span className="font-bold text-slate-900 tracking-tight text-base block">
                      GovConnect
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight font-medium">
                      E-Gov Autofill Assistant
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
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
              <div className="mx-3 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isExtensionConnected ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                  <span className="text-xs font-semibold text-slate-700">
                    {isExtensionConnected ? 'Extension Terhubung' : 'Extension Siap'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  {isExtensionConnected
                    ? 'Autofill & analitik tersinkron secara real-time.'
                    : 'Buka popup ekstensi untuk sinkronisasi otomatis.'}
                </p>
              </div>
            )}

            {/* Logout button */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                {currentNavItem?.label || 'GovConnect'}
              </h1>
            </div>

            {/* Header Right Badges */}
            <div className="flex items-center gap-4">
              {/* Extension Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  isExtensionConnected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
                title={isExtensionConnected ? 'Ekstensi aktif dan tersinkronisasi' : 'Ekstensi siap digunakan'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isExtensionConnected ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isExtensionConnected ? 'Ekstensi Terhubung' : 'Ekstensi Terpasang'}
                </span>
              </div>

              {/* User Avatar Chip */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <span className="text-xs font-semibold text-slate-900 block truncate max-w-[140px]">
                    {user?.email}
                  </span>
                  <span className="text-[10px] text-slate-500">Warga Terverifikasi</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}