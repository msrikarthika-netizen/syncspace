import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/organisms/Layout/AppLayout';
import LandingPage from './pages/Landing';
import { LoginPage, RegisterPage } from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import TaskManagerPage from './pages/TaskManager';
import CommandCenterPage from './pages/CommandCenter';
import AgentMonitorPage from './pages/AgentMonitor';
import { ReportsListPage, ReportDetailPage } from './pages/Reports';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
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
      <Route path="/reports/:reportId" element={<Protected><ReportDetailPage /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
