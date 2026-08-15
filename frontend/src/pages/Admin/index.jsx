import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../apis';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import ErrorBoundary from '../../components/feedback/ErrorBoundary';
import AuditLogPanel from './components/AuditLogPanel';
import ModerationPanel from './components/ModerationPanel';
import MonitoringPanel from './components/MonitoringPanel';
import OverviewPanel from './components/OverviewPanel';
import UserManagementPanel from './components/UserManagementPanel';
import useAdminPanel from './hooks/useAdminPanel';

const confirmationCopy = {
  role: (user, role) => ({ title: `Change ${user.username}'s role?`, description: `This grants the ${role} role. Role changes take effect on the user's next authenticated request.`, confirmLabel: `Make ${role}` }),
  userStatus: (user, active) => ({ title: active ? `Restore ${user.username}'s account?` : `Suspend ${user.username}'s account?`, description: active ? 'The user will be able to sign in again.' : 'The user will be denied future sign-ins. Existing access tokens should be allowed to expire or be revoked by your session policy.', confirmLabel: active ? 'Restore account' : 'Suspend account', destructive: !active }),
  task: (task, action) => ({
    title: action === 'delete' ? `Delete “${task.title}”?` : action === 'retry' ? `Retry “${task.title}”?` : `Stop “${task.title}”?`,
    description: action === 'delete' ? 'This permanently removes the task, generated report, and agent subtasks.' : action === 'retry' ? 'The prior report and agent results will be cleared before a fresh AI workflow starts.' : 'This marks the workflow as failed and notifies live task observers.',
    confirmLabel: action === 'delete' ? 'Delete task' : action === 'retry' ? 'Retry workflow' : 'Stop workflow',
    destructive: action !== 'retry',
  }),
  report: (report) => ({ title: `Remove “${report.title}”?`, description: 'This permanently removes the report content. The parent task remains available for review or retry.', confirmLabel: 'Remove report', destructive: true }),
};

function AdminPanel() {
  const panel = useAdminPanel();
  const [pendingAction, setPendingAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const closeConfirmation = (open) => { if (!open && !submitting) setPendingAction(null); };

  const confirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      if (pendingAction.kind === 'role') {
        await adminAPI.updateUser(pendingAction.user.id, { role: pendingAction.role });
        toast.success('User role updated');
        await Promise.all([panel.loadUsers(), panel.loadDashboard(), panel.loadAuditLogs()]);
      }
      if (pendingAction.kind === 'userStatus') {
        await adminAPI.updateUser(pendingAction.user.id, { isActive: pendingAction.isActive });
        toast.success(pendingAction.isActive ? 'Account restored' : 'Account suspended');
        await Promise.all([panel.loadUsers(), panel.loadDashboard(), panel.loadAuditLogs()]);
      }
      if (pendingAction.kind === 'task') {
        await adminAPI.moderateTask(pendingAction.task.id, { action: pendingAction.action });
        toast.success(pendingAction.action === 'retry' ? 'AI workflow queued for retry' : 'Task moderation action completed');
        await Promise.all([panel.loadTasks(), panel.loadDashboard(), panel.loadMonitoring(), panel.loadAuditLogs()]);
      }
      if (pendingAction.kind === 'report') {
        await adminAPI.deleteReport(pendingAction.report.id, {});
        toast.success('Report removed');
        await Promise.all([panel.loadReports(), panel.loadDashboard(), panel.loadAuditLogs()]);
      }
      setPendingAction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'The administrative action could not be completed');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = pendingAction?.kind === 'role' ? confirmationCopy.role(pendingAction.user, pendingAction.role)
    : pendingAction?.kind === 'userStatus' ? confirmationCopy.userStatus(pendingAction.user, pendingAction.isActive)
      : pendingAction?.kind === 'task' ? confirmationCopy.task(pendingAction.task, pendingAction.action)
        : pendingAction?.kind === 'report' ? confirmationCopy.report(pendingAction.report) : {};

  return (
    <div className="mx-auto max-w-[1550px] space-y-6 px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
      <header className="rounded-[1.75rem] border border-violet-300/15 bg-gradient-to-r from-violet-500/[0.12] via-indigo-500/[0.07] to-transparent p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-300/15 text-violet-100"><ShieldCheck size={23} /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200/70">Restricted workspace</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Administration center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Manage platform access, moderate AI work, monitor dependent services, and review every sensitive control-plane action.</p></div></div>
      </header>

      <OverviewPanel dashboard={panel.dashboard} monitoring={panel.monitoring} loading={panel.loading.dashboard} error={panel.errors.dashboard} onRefresh={panel.refreshAll} />
      <UserManagementPanel data={panel.users} loading={panel.loading.users} error={panel.errors.users} onLoad={panel.loadUsers} onRoleChange={(user, role) => { if (role !== user.role) setPendingAction({ kind: 'role', user, role }); }} onStatusChange={(user, isActive) => setPendingAction({ kind: 'userStatus', user, isActive })} />
      <ModerationPanel tasks={panel.tasks} reports={panel.reports} loading={panel.loading} errors={panel.errors} onLoadTasks={panel.loadTasks} onLoadReports={panel.loadReports} onTaskAction={(task, action) => setPendingAction({ kind: 'task', task, action })} onReportDelete={(report) => setPendingAction({ kind: 'report', report })} />
      <MonitoringPanel data={panel.monitoring} loading={panel.loading.monitoring} error={panel.errors.monitoring} onRefresh={panel.loadMonitoring} />
      <AuditLogPanel data={panel.auditLogs} loading={panel.loading.auditLogs} error={panel.errors.auditLogs} onLoad={panel.loadAuditLogs} />

      <ConfirmDialog open={Boolean(pendingAction)} onOpenChange={closeConfirmation} {...copy} isSubmitting={submitting} onConfirm={confirm} />
    </div>
  );
}

export default function AdminPanelPage() {
  return <ErrorBoundary><AdminPanel /></ErrorBoundary>;
}
