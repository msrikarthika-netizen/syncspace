import { ClipboardList, ShieldCheck } from 'lucide-react';
import { AdminSection, LoadingRows, Pagination, PanelError, RefreshButton } from './AdminPrimitives';

const readableAction = (action) => String(action || '').replaceAll('_', ' ').toLowerCase();

export default function AuditLogPanel({ data, loading, error, onLoad }) {
  return (
    <AdminSection id="audit-logs" title="Security audit & system logs" description="Immutable administrative action records, including actor, target, timestamp, and request context." action={<RefreshButton loading={loading} onClick={() => onLoad({ page: data.page })} />}>
      {error ? <PanelError message={error} retry={() => onLoad({ page: data.page })} /> : loading && !data.items.length ? <LoadingRows rows={5} /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-white/30"><tr><th className="px-3 py-3">Event</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Request context</th><th className="px-3 py-3">Timestamp</th></tr></thead><tbody>{data.items.map((log) => <tr key={log.id} className="border-b border-white/[0.06] last:border-0"><td className="px-3 py-3"><span className="inline-flex items-center gap-2 capitalize text-xs font-bold text-violet-100"><ShieldCheck size={13} /> {readableAction(log.action)}</span></td><td className="px-3 py-3"><p className="text-xs font-semibold text-white/75">{log.actor?.username || 'System'}</p><p className="mt-1 text-[11px] text-white/30">{log.actor?.email || '—'}</p></td><td className="px-3 py-3 text-xs text-white/50"><p className="capitalize">{log.entityType}</p><p className="mt-1 font-mono text-[10px] text-white/25">{log.entityId || '—'}</p></td><td className="px-3 py-3"><p className="max-w-[180px] truncate text-xs text-white/45">{log.ipAddress || 'Unavailable'}</p><p className="mt-1 max-w-[180px] truncate text-[10px] text-white/25">{log.userAgent || 'No user agent'}</p></td><td className="px-3 py-3 text-xs text-white/40">{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{!data.items.length && <div className="py-10 text-center text-sm text-white/35"><ClipboardList className="mx-auto mb-3 text-white/20" size={22} />No administrative actions have been recorded yet.</div>}</div>
      )}
      <Pagination {...data} onPageChange={(page) => onLoad({ page })} />
    </AdminSection>
  );
}
