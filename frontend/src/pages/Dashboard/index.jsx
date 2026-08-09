import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, ListTodo, Clock, CheckCircle2, XCircle,
  Zap, BrainCircuit, FileText, ArrowRight, TrendingUp
} from 'lucide-react';
import { tasksAPI } from '../../apis';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/atoms/StatusBadge';
import PriorityBadge from '../../components/atoms/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon: Icon, color, bg, label, value, sub }) {
  return (
    <div className={`card p-5 border ${bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        {sub && <span className="text-xs text-white/30">{sub}</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-0.5">{value ?? '—'}</p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tasksAPI.list(), tasksAPI.stats()])
      .then(([tRes, sRes]) => {
        setTasks(tRes.data.data.slice(0, 6));
        setStats(sRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">
            Good {greeting()}, {user?.username} 👋
          </h1>
          <p className="page-subtitle mt-1">Here's what your AI agents are working on.</p>
        </div>
        {isManager && (
          <Link to="/tasks/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Assign new task
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ListTodo} color="text-white" bg="bg-surface-2/50 border-white/10"
          label="Total tasks" value={stats?.total} />
        <StatCard icon={Zap} color="text-brand-400" bg="bg-brand-500/10 border-brand-500/15"
          label="Processing" value={(stats?.queued ?? 0) + (stats?.processing ?? 0)} sub="active" />
        <StatCard icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/15"
          label="Completed" value={stats?.completed} />
        <StatCard icon={XCircle} color="text-red-400" bg="bg-red-500/10 border-red-500/15"
          label="Failed" value={stats?.failed} />
      </div>

      {/* Completion bar */}
      {stats?.total > 0 && (
        <div className="card p-5 mb-8 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/70 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-400" /> Completion rate
            </span>
            <span className="text-sm font-bold text-white">
              {Math.round((stats.completed / stats.total) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-white/30">
            <span>{stats.completed} completed</span>
            <span>{stats.total - stats.completed} remaining</span>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="flex items-center justify-between mb-4">
        <p className="section-header mb-0">Recent tasks</p>
        <Link to="/tasks" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 border-white/10 animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-3 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState isManager={isManager} />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <Link key={task._id} to={`/agents/${task._id}`}
              className="card p-5 border-white/10 flex items-center gap-4 hover:border-brand-500/30 transition-all group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                    {task.title}
                  </h3>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="text-sm text-white/40 truncate">{task.description}</p>
                <p className="text-xs text-white/25 mt-1.5">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Progress */}
                {task.status !== 'completed' && task.status !== 'failed' && (
                  <div className="w-20">
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${task.progress || 0}%` }} />
                    </div>
                    <p className="text-xs text-white/30 text-right mt-0.5">{task.progress ?? 0}%</p>
                  </div>
                )}
                <StatusBadge status={task.status} />
                {task.status === 'completed' && (
                  <FileText size={14} className="text-white/20 group-hover:text-brand-400 transition-colors" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ isManager }) {
  return (
    <div className="card p-12 border-white/10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
        <BrainCircuit size={26} className="text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
      <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
        Assign your first task and watch AI agents break it down and complete it for you.
      </p>
      {isManager && (
        <Link to="/tasks/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={15} /> Assign first task
        </Link>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
