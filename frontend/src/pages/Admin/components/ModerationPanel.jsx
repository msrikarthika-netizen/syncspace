import { FileText, RefreshCw, Search, ShieldAlert, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AdminSection, LoadingRows, Pagination, PanelError, RefreshButton, StatusPill } from './AdminPrimitives';

function TaskTable({ data, loading, error, onLoad, onAction }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const applyFilters = (page = 1) => onLoad({ page, search, status });
  return (
    <AdminSection title="Task moderation" description="Retry recoverable workflows, stop unsafe work, or permanently remove a task." action={<RefreshButton loading={loading} onClick={() => applyFilters(data.page)} />}>
      <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }} className="mb-4 grid gap-2 md:grid-cols-[1fr_170px_auto]">
        <label className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-300/50" placeholder="Search task title or description" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#171822] px-3 text-sm text-white outline-none focus:border-violet-300/50"><option value="">All statuses</option><option value="pending">Pending</option><option value="queued">Queued</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select>
        <button type="submit" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#151620] transition hover:bg-violet-100">Apply</button>
      </form>
      {error ? <PanelError message={error} retry={() => applyFilters(data.page)} /> : loading && !data.items.length ? <LoadingRows rows={5} /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-white/30"><tr><th className="px-3 py-3">Task</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">State</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Moderation</th></tr></thead><tbody>{data.items.map((task) => <tr key={task.id} className="border-b border-white/[0.06] last:border-0"><td className="max-w-[340px] px-3 py-3"><p className="truncate font-semibold text-white">{task.title}</p><p className="mt-1 truncate text-xs text-white/35">{task.description}</p></td><td className="px-3 py-3"><p className="text-xs font-semibold text-white/70">{task.owner?.username || 'Unknown user'}</p><p className="mt-1 text-[11px] text-white/35">{task.owner?.email || '—'}</p></td><td className="px-3 py-3"><div className="flex items-center gap-2"><StatusPill status={task.status} /><span className="text-xs text-white/35">{task.progress}%</span></div></td><td className="px-3 py-3 text-xs text-white/40">{new Date(task.createdAt).toLocaleDateString()}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => onAction(task, 'retry')} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/20 px-2 py-1.5 text-[11px] font-bold text-cyan-100 transition hover:bg-cyan-300/10"><RefreshCw size={12} /> Retry</button><button type="button" onClick={() => onAction(task, 'mark_failed')} className="inline-flex items-center gap-1 rounded-lg border border-amber-200/20 px-2 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-200/10"><XCircle size={12} /> Stop</button><button type="button" onClick={() => onAction(task, 'delete')} className="inline-flex items-center gap-1 rounded-lg border border-red-300/20 px-2 py-1.5 text-[11px] font-bold text-red-200 transition hover:bg-red-300/10"><Trash2 size={12} /> Delete</button></div></td></tr>)}</tbody></table>{!data.items.length && <div className="py-10 text-center text-sm text-white/35"><ShieldAlert className="mx-auto mb-3 text-white/20" size={22} />No tasks require review for these filters.</div>}</div>
      )}
      <Pagination {...data} onPageChange={applyFilters} />
    </AdminSection>
  );
}

function ReportTable({ data, loading, error, onLoad, onDelete }) {
  const [search, setSearch] = useState('');
  const applyFilters = (page = 1) => onLoad({ page, search });
  return (
    <AdminSection title="Report content" description="Remove AI-generated content that violates workspace policy or was produced in error." action={<RefreshButton loading={loading} onClick={() => applyFilters(data.page)} />}>
      <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }} className="mb-4 flex gap-2"><label className="relative min-w-0 flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-300/50" placeholder="Search report title or summary" /></label><button type="submit" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#151620] transition hover:bg-violet-100">Apply</button></form>
      {error ? <PanelError message={error} retry={() => applyFilters(data.page)} /> : loading && !data.items.length ? <LoadingRows rows={4} /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-white/30"><tr><th className="px-3 py-3">Report</th><th className="px-3 py-3">Task</th><th className="px-3 py-3">Generated by</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{data.items.map((report) => <tr key={report.id} className="border-b border-white/[0.06] last:border-0"><td className="max-w-[280px] px-3 py-3"><p className="truncate font-semibold text-white">{report.title}</p><p className="mt-1 truncate text-xs text-white/35">{report.summary}</p></td><td className="max-w-[180px] px-3 py-3 text-xs text-white/55">{report.taskTitle || 'Removed task'}</td><td className="px-3 py-3 text-xs text-white/55">{report.generatedByUsername || 'System'}</td><td className="px-3 py-3 text-xs text-white/40">{new Date(report.createdAt).toLocaleDateString()}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => onDelete(report)} className="inline-flex items-center gap-1 rounded-lg border border-red-300/20 px-2.5 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-300/10"><Trash2 size={13} /> Remove</button></td></tr>)}</tbody></table>{!data.items.length && <div className="py-10 text-center text-sm text-white/35"><FileText className="mx-auto mb-3 text-white/20" size={22} />No reports match the selected filters.</div>}</div>
      )}
      <Pagination {...data} onPageChange={applyFilters} />
    </AdminSection>
  );
}

export default function ModerationPanel({ tasks, reports, loading, errors, onLoadTasks, onLoadReports, onTaskAction, onReportDelete }) {
  return <section id="moderation" className="scroll-mt-24 space-y-5"><div><h2 className="text-xl font-bold text-white">Task & content moderation</h2><p className="mt-1 text-sm text-white/40">Sensitive actions are confirmed and written to the administrative audit trail.</p></div><TaskTable data={tasks} loading={loading.tasks} error={errors.tasks} onLoad={onLoadTasks} onAction={onTaskAction} /><ReportTable data={reports} loading={loading.reports} error={errors.reports} onLoad={onLoadReports} onDelete={onReportDelete} /></section>;
}
