import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export function AdminSection({ id, title, description, action, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-[1.75rem] border border-white/[0.09] bg-white/[0.025] p-5 shadow-2xl shadow-black/10 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-white/40">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LoadingRows({ rows = 3 }) {
  return <div className="space-y-2">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-white/[0.055]" />)}</div>;
}

export function PanelError({ message, retry }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-red-200"><AlertCircle size={16} /> {message}</p>
      {retry && <button type="button" onClick={retry} className="rounded-lg border border-red-300/20 px-3 py-1.5 text-xs font-bold text-red-100 transition hover:bg-red-300/10">Retry</button>}
    </div>
  );
}

export function StatusPill({ status }) {
  const normalized = String(status || 'unknown').toLowerCase();
  const styles = {
    healthy: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    active: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    processing: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    queued: 'border-amber-200/20 bg-amber-200/10 text-amber-100',
    pending: 'border-white/15 bg-white/[0.06] text-white/60',
    failed: 'border-red-300/20 bg-red-300/10 text-red-200',
    suspended: 'border-red-300/20 bg-red-300/10 text-red-200',
    degraded: 'border-amber-200/20 bg-amber-200/10 text-amber-100',
    unhealthy: 'border-red-300/20 bg-red-300/10 text-red-200',
    not_monitored: 'border-white/10 bg-white/[0.05] text-white/45',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[normalized] || styles.pending}`}>{normalized.replace('_', ' ')}</span>;
}

export function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs text-white/40">
      <span>Page {page} of {totalPages} · {total} records</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-white/10 p-1.5 text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={15} /></button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-white/10 p-1.5 text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

export function RefreshButton({ loading, onClick, label = 'Refresh' }) {
  return <button type="button" onClick={onClick} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"><Loader2 size={14} className={loading ? 'animate-spin' : ''} /> {label}</button>;
}
