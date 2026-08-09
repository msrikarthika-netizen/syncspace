import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, X, Loader2, ListTodo, ChevronDown, Search,
  Trash2, Eye, BrainCircuit, Tag, Calendar
} from 'lucide-react';
import { tasksAPI } from '../../apis';
import StatusBadge from '../../components/atoms/StatusBadge';
import PriorityBadge from '../../components/atoms/PriorityBadge';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function NewTaskForm({ onCreated, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', tags: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const res = await tasksAPI.create(payload);
      toast.success('Task assigned to AI agents!');
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 border-brand-500/20 mb-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-brand-400" />
          <h2 className="font-semibold text-white">Assign task to AI</h2>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Task title <span className="text-red-400">*</span></label>
          <input className="input" placeholder="e.g. Build a REST API for user authentication"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Describe what needs to be done <span className="text-red-400">*</span></label>
          <textarea className="input min-h-[100px] resize-y font-sans"
            placeholder="Explain the task in detail. The AI orchestrator will read this and delegate subtasks to specialist agents..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required rows={4} />
          <p className="text-xs text-white/25 mt-1.5">The more detail you provide, the better the agents perform.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <div className="relative">
              <select className="input appearance-none pr-8"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-1"><Tag size={12} /> Tags (comma-separated)</label>
            <input className="input" placeholder="e.g. backend, api, auth"
              value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Assigning to AI...</>
              : <><BrainCircuit size={15} /> Assign to AI agents</>
            }
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function TaskManagerPage() {
  const { isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(location.pathname === '/tasks/new');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await tasksAPI.list(params);
      setTasks(res.data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!confirm('Delete this task and all its data?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(ts => ts.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleCreated = (task) => {
    setTasks(ts => [task, ...ts]);
    setShowForm(false);
    navigate(`/agents/${task._id}`);
  };

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Assign tasks to AI agents and track their progress.</p>
        </div>
        {!showForm && isManager && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Assign new task
          </button>
        )}
      </div>

      {showForm && <NewTaskForm onCreated={handleCreated} onClose={() => setShowForm(false)} />}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-9 py-2.5 text-sm" placeholder="Search tasks..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input py-2.5 pr-8 text-sm appearance-none w-36"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['pending', 'queued', 'processing', 'completed', 'failed'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 border-white/10 animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-2/5 mb-3" />
              <div className="h-3 bg-surface-3 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 border-white/10 text-center">
          <ListTodo size={32} className="mx-auto text-white/20 mb-3" />
          <h3 className="font-medium text-white/60 mb-1">No tasks found</h3>
          <p className="text-sm text-white/30">
            {search ? 'Try a different search term' : 'Create your first task above'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task._id} onClick={() => navigate(`/agents/${task._id}`)}
              className="card p-5 border-white/10 flex items-start gap-4 hover:border-brand-500/30 transition-all group block cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-medium text-white group-hover:text-brand-300 transition-colors truncate">
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                  {task.tags?.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/40 line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/25">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </span>
                  {task.subtasks?.length > 0 && (
                    <span>{task.subtasks.length} subtasks</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {task.progress !== undefined && task.status !== 'completed' && (
                  <div className="w-16 text-right">
                    <span className="text-xs text-white/30">{task.progress}%</span>
                    <div className="h-1 bg-surface-3 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                )}
                <StatusBadge status={task.status} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/agents/${task._id}`}
                    className="p-1.5 rounded-lg hover:bg-brand-500/20 text-white/30 hover:text-brand-400"
                    onClick={e => e.stopPropagation()}>
                    <Eye size={14} />
                  </Link>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); handleDelete(task._id, e); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
