import { Activity, Bot, CheckCircle2, FileText, Users } from 'lucide-react';
import { AdminSection, LoadingRows, PanelError, RefreshButton, StatusPill } from './AdminPrimitives';

const cards = [
  { key: 'users', label: 'Registered users', icon: Users, tone: 'text-violet-200 bg-violet-300/10' },
  { key: 'active_users', label: 'Active accounts', icon: CheckCircle2, tone: 'text-emerald-200 bg-emerald-300/10' },
  { key: 'tasks', label: 'Total tasks', icon: Activity, tone: 'text-cyan-100 bg-cyan-300/10' },
  { key: 'reports', label: 'AI reports', icon: FileText, tone: 'text-amber-100 bg-amber-200/10' },
];

export default function OverviewPanel({ dashboard, monitoring, loading, error, onRefresh }) {
  const metrics = dashboard?.metrics;
  const statuses = metrics?.taskStatuses || {};

  return (
    <AdminSection id="overview" title="System overview" description="Live platform signals, workload state, and recently audited actions." action={<RefreshButton loading={loading} onClick={onRefresh} />}>
      {error ? <PanelError message={error} retry={onRefresh} /> : loading && !dashboard ? <LoadingRows rows={4} /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ key, label, icon: Icon, tone }) => (
              <div key={key} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div>
                <p className="mt-4 text-2xl font-extrabold text-white">{metrics?.[key] ?? '—'}</p>
                <p className="mt-1 text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-white">Workflow distribution</p><Bot size={16} className="text-violet-200" /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {['pending', 'queued', 'processing', 'completed', 'failed'].map((status) => <div key={status} className="rounded-xl bg-white/[0.04] p-3"><p className="text-lg font-bold text-white">{statuses[status] || 0}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35">{status}</p></div>)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-bold text-white">Service pulse</p>
              <div className="mt-3 space-y-2">
                {(monitoring?.services || []).slice(0, 3).map((service) => <div key={service.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5"><span className="truncate text-xs font-semibold text-white/65">{service.name}</span><StatusPill status={service.status} /></div>)}
                {!monitoring && <p className="text-xs text-white/35">Monitoring data is loading.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminSection>
  );
}
