import { Loader2 } from 'lucide-react';

const CONFIG = {
  pending:    { label: 'Pending',    cls: 'status-pending' },
  queued:     { label: 'Queued',     cls: 'status-queued' },
  processing: { label: 'Processing', cls: 'status-processing', spin: true },
  in_progress:{ label: 'In Progress',cls: 'status-processing', spin: true },
  completed:  { label: 'Completed',  cls: 'status-completed' },
  failed:     { label: 'Failed',     cls: 'status-failed' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const c = CONFIG[status] || { label: status, cls: 'status-pending' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.spin && <Loader2 size={10} className="animate-spin" />}
      {c.label}
    </span>
  );
}
