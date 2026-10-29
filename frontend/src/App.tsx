import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Demo } from './pages/Demo';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/Profile';
import { ActivityPage } from './pages/Activity';
import { SettingsPage } from './pages/Settings';
import { TemplatesPage } from './pages/Templates';
import { NotificationsPage } from './pages/Notifications';
import { PublicServicesPage, PublicServiceDetailPage } from './pages/PublicServices';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { UserComplaintsPage } from './pages/UserComplaints';
import { FontAwesome } from './components/ui';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesome name="spinner" spin className="text-3xl text-[#0A4174]" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesome name="spinner" spin className="text-3xl text-[#0A4174]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesome name="spinner" spin className="text-3xl text-[#0A4174]" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Demo />} />
      <Route element={<PublicRoute><AuthPage /></PublicRoute>}>
        <Route path="/login" element={null} />
        <Route path="/register" element={null} />
      </Route>
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/public-services" element={<PublicServicesPage />} />
        <Route path="/public-services/:id" element={<PublicServiceDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/complaints" element={<UserComplaintsPage />} />
      </Route>
      <Route element={<AdminRoute><Layout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/audit" element={<AdminAudit />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
