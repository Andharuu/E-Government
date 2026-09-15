import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, History, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/activity', label: 'Activity', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-white border-r border-slate-200 ${collapsed ? 'w-16' : 'w-64'}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                {!collapsed && <span className="font-semibold text-slate-900">GovConnect</span>}
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-200">
              <button
                onClick={logout}
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors`
                }
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="font-medium">Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}