const CONFIG = {
  low:      { label: 'Low',      cls: 'priority-low' },
  medium:   { label: 'Medium',   cls: 'priority-medium' },
  high:     { label: 'High',     cls: 'priority-high' },
  critical: { label: 'Critical', cls: 'priority-critical' },
};

export default function PriorityBadge({ priority }) {
  const c = CONFIG[priority] || { label: priority, cls: 'priority-medium' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}
