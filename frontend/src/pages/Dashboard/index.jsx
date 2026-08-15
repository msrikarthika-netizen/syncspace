import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Command,
  FileText,
  Layers3,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tasksAPI } from '../../apis';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/atoms/StatusBadge';
import PriorityBadge from '../../components/atoms/PriorityBadge';
import neuralNetworkImage from '../../assets/ai-neural-network-4k.png';
import workspaceImage from '../../assets/ai-workspace-collaboration.png';

const statCards = [
  {
    key: 'total',
    label: 'Total tasks',
    icon: ListTodo,
    accent: 'from-violet-400 to-indigo-500',
    iconBg: 'bg-violet-400/15 text-violet-200',
  },
  {
    key: 'active',
    label: 'In motion',
    icon: Zap,
    accent: 'from-cyan-300 to-blue-500',
    iconBg: 'bg-cyan-300/15 text-cyan-200',
    note: 'active',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    accent: 'from-emerald-300 to-teal-500',
    iconBg: 'bg-emerald-300/15 text-emerald-200',
  },
  {
    key: 'failed',
    label: 'Needs review',
    icon: XCircle,
    accent: 'from-rose-300 to-orange-500',
    iconBg: 'bg-rose-300/15 text-rose-200',
  },
];

function StatCard({ card, value }) {
  const Icon = card.icon;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${card.accent}`} />
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconBg}`}>
          <Icon size={19} />
        </div>
        {card.note && (
          <span className="flex items-center gap-1.5 rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            {card.note}
          </span>
        )}
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-white">{value ?? '—'}</p>
      <p className="mt-1 text-sm text-white/45">{card.label}</p>
    </div>
  );
}

function ProgressRing({ value }) {
  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#a78bfa ${value}%, rgba(255,255,255,0.1) ${value}% 100%)` }}
    >
      <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-[#12121c]">
        <span className="text-2xl font-extrabold text-white">{value}%</span>
        <span className="text-[10px] uppercase tracking-wider text-white/35">complete</span>
      </div>
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
      .then(([tasksResponse, statsResponse]) => {
        setTasks(tasksResponse.data.data.slice(0, 6));
        setStats(statsResponse.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = Number(stats?.total || 0);
  const completed = Number(stats?.completed || 0);
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const activeTasks = Number(stats?.queued || 0) + Number(stats?.processing || 0);
  const firstName = user?.username?.split(' ')[0] || 'there';
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

  const workflowLabel = useMemo(() => {
    if (activeTasks > 0) return `${activeTasks} ${activeTasks === 1 ? 'task is' : 'tasks are'} moving right now`;
    if (completed > 0) return 'Your workspace is up to date';
    return 'Ready when you are';
  }, [activeTasks, completed]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0d0d14] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden">
        <img src={workspaceImage} alt="Team collaborating around a shared AI workspace" className="h-full w-full object-cover object-center opacity-35 saturate-[0.8]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d14] via-[#0d0d14]/80 to-[#0d0d14]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/10 via-[#0d0d14]/55 to-[#0d0d14]" />
      </div>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-amber-300/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
              <span className="h-2 w-2 rounded-full bg-amber-200 shadow-lg shadow-amber-200/70" />
              Monday workspace brief
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              Good {greeting()}, {firstName} <span className="inline-block origin-bottom-right animate-[wave_2s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="mt-3 text-sm text-white/45 sm:text-base">Your AI team is turning priorities into progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/45 sm:flex">
              <CalendarDays size={14} className="text-violet-300" />
              {today}
            </div>
            {isManager && (
              <Link to="/tasks/new" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#13131c] shadow-xl shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-100">
                <Plus size={16} /> Assign new task
              </Link>
            )}
          </div>
        </header>

        <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/15 bg-[#10131a]/60 p-6 shadow-2xl shadow-black/20 backdrop-blur-[2px] sm:p-8">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amber-200/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-violet-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-100">
                <Sparkles size={14} />
                Your operating picture
              </div>
              <h2 className="max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                Keep the important work in motion.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">SyncSpace keeps every brief, specialist agent, and final decision connected in one calm workspace.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={isManager ? '/tasks/new' : '/tasks'} className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-bold text-[#1a1231] transition hover:bg-white">
                  {isManager ? 'Start a workflow' : 'View my tasks'} <ArrowUpRight size={15} />
                </Link>
                <Link to="/command-center" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/40 hover:bg-white/10">
                  <Command size={15} /> Open command center
                </Link>
              </div>
            </div>
            <div className="relative h-36 w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-black/20 lg:h-40">
              <img src={neuralNetworkImage} alt="Connected AI workflow visualization" className="h-full w-full object-cover opacity-65 mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#10131a] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Neural network online
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {statCards.map((card) => (
            <StatCard key={card.key} card={card} value={card.key === 'active' ? activeTasks : stats?.[card.key]} />
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-3xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Recent tasks</h2>
                  {activeTasks > 0 && <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Live</span>}
                </div>
                <p className="mt-1 text-xs text-white/35">A quick look at the latest work in your space.</p>
              </div>
              <Link to="/tasks" className="flex items-center gap-1 text-xs font-bold text-violet-300 transition hover:text-violet-200">View all <ArrowRight size={13} /></Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, index) => <div key={index} className="h-[88px] animate-pulse rounded-2xl bg-white/[0.05]" />)}</div>
            ) : tasks.length === 0 ? (
              <EmptyState isManager={isManager} />
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => <TaskRow key={task._id} task={task} />)}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.025] p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/40"><Target size={14} className="text-violet-300" /> Delivery pulse</div>
                  <p className="mt-2 text-sm text-white/55">Your completion rhythm</p>
                </div>
                <TrendingUp size={18} className="text-emerald-300" />
              </div>
              <div className="flex items-center gap-5">
                <ProgressRing value={completionRate} />
                <div>
                  <p className="text-sm font-bold text-white">{workflowLabel}</p>
                  <p className="mt-2 text-xs leading-5 text-white/35">{completed} completed out of {total || 0} total assignments.</p>
                </div>
              </div>
              {total > 0 && <div className="mt-6 flex gap-2"><div className="h-1.5 flex-1 rounded-full bg-emerald-300" /><div className="h-1.5 w-1/4 rounded-full bg-violet-300" /><div className="h-1.5 w-1/6 rounded-full bg-white/10" /></div>}
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#151522] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/40"><Activity size={14} className="text-cyan-300" /> System status</div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Healthy</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatusTile icon={BrainCircuit} label="Core AI" value="Ready" color="text-violet-300" />
                <StatusTile icon={Layers3} label="Agents" value={activeTasks ? `${activeTasks} active` : 'Standing by'} color="text-cyan-300" />
              </div>
              <Link to="/command-center" className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-bold text-white/45 transition hover:text-white">
                Monitor your AI team <ArrowUpRight size={14} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isActive = !['completed', 'failed'].includes(task.status);

  return (
    <Link to={`/agents/${task._id}`} className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/[0.025] p-4 transition hover:border-violet-300/20 hover:bg-violet-300/[0.06] sm:gap-4">
      <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${isActive ? 'bg-cyan-300/10 text-cyan-200' : task.status === 'completed' ? 'bg-emerald-300/10 text-emerald-200' : 'bg-rose-300/10 text-rose-200'}`}>
        {isActive ? <Clock3 size={17} /> : task.status === 'completed' ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold text-white transition group-hover:text-violet-200">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="mt-1 truncate text-xs text-white/35">{task.description}</p>
        <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/25">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {isActive && <div className="hidden w-20 sm:block"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all" style={{ width: `${task.progress || 0}%` }} /></div><p className="mt-1 text-right text-[10px] text-white/30">{task.progress ?? 0}%</p></div>}
        <StatusBadge status={task.status} />
        {task.status === 'completed' ? <FileText size={14} className="text-white/25 transition group-hover:text-violet-300" /> : <ArrowUpRight size={14} className="text-white/20 transition group-hover:text-violet-300" />}
      </div>
    </Link>
  );
}

function StatusTile({ icon: Icon, label, value, color }) {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-3"><Icon size={15} className={color} /><p className="mt-3 text-[10px] uppercase tracking-wider text-white/30">{label}</p><p className="mt-1 text-xs font-bold text-white/75">{value}</p></div>;
}

function EmptyState({ isManager }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/20 to-cyan-300/10 text-violet-200"><BrainCircuit size={25} /></div>
      <h3 className="text-base font-bold text-white">No tasks yet</h3>
      <p className="mx-auto mb-5 mt-2 max-w-xs text-xs leading-5 text-white/35">Assign your first task and watch your AI team turn it into momentum.</p>
      {isManager && <Link to="/tasks/new" className="inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-[#1a1231] hover:bg-violet-200"><Plus size={14} /> Assign first task</Link>}
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
