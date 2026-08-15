import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../../../apis';

const emptyPage = { items: [], total: 0, page: 1, limit: 20 };

const messageFor = (error) => error.response?.data?.message || error.message || 'Unable to load administrative data';

export default function useAdminPanel() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState(emptyPage);
  const [tasks, setTasks] = useState(emptyPage);
  const [reports, setReports] = useState(emptyPage);
  const [monitoring, setMonitoring] = useState(null);
  const [auditLogs, setAuditLogs] = useState(emptyPage);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(async (key, request, update) => {
    setLoading((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: null }));
    try {
      const response = await request();
      update(response.data.data);
      return response.data.data;
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: messageFor(error) }));
      throw error;
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  }, []);

  const loadDashboard = useCallback(() => load('dashboard', adminAPI.dashboard, setDashboard), [load]);
  const loadMonitoring = useCallback(() => load('monitoring', adminAPI.monitoring, setMonitoring), [load]);
  const loadUsers = useCallback((params = {}) => load('users', () => adminAPI.users(params), setUsers), [load]);
  const loadTasks = useCallback((params = {}) => load('tasks', () => adminAPI.tasks(params), setTasks), [load]);
  const loadReports = useCallback((params = {}) => load('reports', () => adminAPI.reports(params), setReports), [load]);
  const loadAuditLogs = useCallback((params = {}) => load('auditLogs', () => adminAPI.auditLogs(params), setAuditLogs), [load]);

  const refreshAll = useCallback(async () => {
    const requests = [loadDashboard(), loadMonitoring(), loadUsers(), loadTasks(), loadReports(), loadAuditLogs()];
    await Promise.allSettled(requests);
  }, [loadAuditLogs, loadDashboard, loadMonitoring, loadReports, loadTasks, loadUsers]);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  return {
    dashboard,
    users,
    tasks,
    reports,
    monitoring,
    auditLogs,
    loading,
    errors,
    loadDashboard,
    loadMonitoring,
    loadUsers,
    loadTasks,
    loadReports,
    loadAuditLogs,
    refreshAll,
  };
}
