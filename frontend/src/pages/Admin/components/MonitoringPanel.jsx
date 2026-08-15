import { Activity, Database, RefreshCw, ServerCog, Workflow } from 'lucide-react';
import { AdminSection, LoadingRows, PanelError, RefreshButton, StatusPill } from './AdminPrimitives';

const icons = { backend: ServerCog, database: Database, ai: Activity, redis: Workflow };

export default function MonitoringPanel({ data, loading, error, onRefresh }) {
  return (
    <AdminSection id="monitoring" title="AI service & API monitoring" description="Health checks are server-side; no provider credentials or infrastructure addresses are exposed to the browser." action={<RefreshButton loading={loading} onClick={onRefresh} />}>
      {error ? <PanelError message={error} retry={onRefresh} /> : loading && !data ? <LoadingRows rows={4} /> : (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {(data?.services || []).map((service) => {
              const Icon = icons[service.key] || Activity;
              return <div key={service.key} className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200"><Icon size={18} /></div><StatusPill status={service.status} /></div><p className="mt-4 text-sm font-bold text-white">{service.name}</p><p className="mt-1 text-xs leading-5 text-white/40">{service.detail}</p></div>;
            })}
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-5"><div className="flex items-center gap-2 text-sm font-bold text-white"><Workflow size={16} className="text-cyan-100" /> Workflow pressure</div><div className="mt-5 space-y-4">{[['Queued', data?.workflow?.queued, 'bg-amber-200'], ['Processing', data?.workflow?.processing, 'bg-cyan-300'], ['Failed', data?.workflow?.failed, 'bg-red-300']].map(([label, value, tone]) => <div key={label}><div className="flex justify-between text-xs"><span className="text-white/45">{label}</span><span className="font-bold text-white">{value ?? 0}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Number(value || 0) * 10)}%` }} /></div></div>)}</div><p className="mt-6 border-t border-white/[0.08] pt-4 text-[11px] leading-5 text-white/30">Last sampled {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : '—'}.</p></div>
        </div>
      )}
    </AdminSection>
  );
}
