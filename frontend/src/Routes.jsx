import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/organisms/Layout/AppLayout';
import LandingPage from './pages/Landing';
import { LoginPage, RegisterPage } from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import TaskManagerPage from './pages/TaskManager';
import CommandCenterPage from './pages/CommandCenter';
import AgentMonitorPage from './pages/AgentMonitor';
import { ReportsListPage, ReportDetailPage } from './pages/Reports';
import ProfilePage from './pages/Profile';
import SubscriptionPage from './pages/Subscription';
import AdminPanelPage from './pages/Admin';
import AdminLayout from './components/organisms/Layout/AdminLayout';

const ReportDashboardPage = lazy(() => import('./pages/ReportDashboard'));

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AdminProtected({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

      {/* Protected */}
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/command-center" element={<Protected><CommandCenterPage /></Protected>} />
      <Route path="/tasks" element={<Protected><TaskManagerPage /></Protected>} />
      <Route path="/tasks/new" element={<Protected><TaskManagerPage /></Protected>} />
      <Route path="/agents/:taskId" element={<Protected><AgentMonitorPage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsListPage /></Protected>} />
      <Route path="/reports/:reportId/dashboard" element={<Protected><Suspense fallback={<div className="p-8 text-white/50">Loading dashboard…</div>}><ReportDashboardPage /></Suspense></Protected>} />
      <Route path="/reports/:reportId" element={<Protected><ReportDetailPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/subscription" element={<Protected><SubscriptionPage /></Protected>} />
      <Route path="/admin" element={<AdminProtected><AdminPanelPage /></AdminProtected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
