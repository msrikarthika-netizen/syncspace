import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search, Code2, PenLine, BarChart2, Bot, CheckCircle2,
  XCircle, Clock, Loader2, FileText, ArrowLeft, Zap, Sparkles
} from 'lucide-react';
import { tasksAPI } from '../../apis';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/atoms/StatusBadge';
import PriorityBadge from '../../components/atoms/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

const AGENT_META = {
  research: { icon: Search,   color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20', shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]', label: 'Research Agent', desc: 'Scours sources to gather rich context, facts, and essential references for the task.' },
  analysis: { icon: BarChart2,color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]', label:'Analysis Agent', desc: 'Evaluates requirements, identifies deep patterns, and designs logical execution steps.' },
  coding:   { icon: Code2,    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20', shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]', label: 'Coding Agent', desc: 'Architects and writes clean, production-ready code algorithms and scripts.' },
  writing:  { icon: PenLine,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20', shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]', label: 'Writing Agent', desc: 'Synthesizes technical data into beautiful, structured, human-readable reports.' },
};

function PremiumAgentCard({ meta, subtask, isActive }) {
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);

  const isRunning = subtask?.status === 'running';
  const isCompleted = subtask?.status === 'completed';
  const isFailed = subtask?.status === 'failed';

  const borderStyle = isRunning ? `border-white/20 ${meta.shadow}` :
                      isCompleted ? 'border-emerald-500/20' :
                      isFailed ? 'border-red-500/20' : 'border-white/5 hover:border-white/10';

  const bgStyle = isRunning ? 'bg-surface-2/60 backdrop-blur-xl' : 'bg-surface-2/20 backdrop-blur-sm';

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-700 ${borderStyle} ${bgStyle}`}>
      {isRunning && (
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-40 transition-opacity duration-1000 ${meta.bg.split(' ')[0]}`} />
      )}
      
      <div className="p-7 relative z-10">
        <div className="flex items-start gap-5">
          <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${meta.bg} border transition-all duration-500 ${isRunning ? 'scale-110 shadow-lg' : ''}`}>
            <Icon size={24} className={meta.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-bold tracking-wide uppercase ${meta.color}`}>{meta.label}</span>
              {subtask && <SubtaskStatusIcon status={subtask.status} />}
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed mb-4">{meta.desc}</p>
            
            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-4" />

            {!subtask ? (
              <div className="text-[13px] text-white/20 flex items-center gap-2 font-medium">
                {isActive ? (
                  <><Loader2 size={13} className="animate-spin opacity-50" /> Waiting for orchestrator assignment...</>
                ) : (
                  <><Bot size={13} className="opacity-50" /> Idle</>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h4 className="font-semibold text-white text-[15px] mb-1.5 leading-snug">{subtask.title}</h4>
                <p className="text-[13px] text-white/60 leading-relaxed mb-4">{subtask.description}</p>
                
                {isRunning && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className={`animate-pulse ${meta.color}`} />
                      <span className={`text-xs font-semibold tracking-wide uppercase ${meta.color}`}>Actively Processing</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite] ${meta.bg.split(' ')[0]}`}
                        style={{ width: '60%' }} />
                    </div>
                  </div>
                )}

                {subtask.durationMs && (
                   <div className="text-[13px] font-medium text-emerald-400/80 flex items-center gap-1.5">
                     <CheckCircle2 size={14} /> Completed in {(subtask.durationMs / 1000).toFixed(1)}s
                   </div>
                )}

                {subtask.result && (
                  <div className="mt-4">
                    <button
                      onClick={() => setExpanded(e => !e)}
                      className={`text-[13px] font-medium flex items-center gap-1.5 transition-colors ${meta.color} hover:opacity-80`}>
                      {expanded ? 'Hide Agent Output ↑' : 'View Detailed Output ↓'}
                    </button>
                    {expanded && (
                      <div className="mt-3 p-4 bg-black/50 backdrop-blur-md rounded-2xl text-[13px] text-white/70 font-mono
                                      leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap border border-white/5 shadow-inner">
                        {subtask.result}
                      </div>
                    )}
                  </div>
                )}

                {subtask.error && (
                  <div className="mt-3 p-4 bg-red-500/10 backdrop-blur-md rounded-2xl border border-red-500/20 text-[13px] text-red-400 flex items-start gap-2.5">
                    <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{subtask.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubtaskStatusIcon({ status }) {
  if (status === 'completed') return <div className="bg-emerald-500/10 p-1.5 rounded-full"><CheckCircle2 size={14} className="text-emerald-400" /></div>;
  if (status === 'failed')    return <div className="bg-red-500/10 p-1.5 rounded-full"><XCircle size={14} className="text-red-400" /></div>;
  if (status === 'running')   return <div className="bg-white/5 p-1.5 rounded-full"><Loader2 size={14} className="animate-spin text-white/60" /></div>;
  return <Clock size={14} className="text-white/30" />;
}

export default function AgentMonitorPage() {
  const { taskId } = useParams();
  const { joinTaskRoom, leaveTaskRoom, on, off } = useSocket();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    tasksAPI.getById(taskId)
      .then(res => {
        const t = res.data.data;
        setTask(t);
        setSubtasks(t.subtasks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    if (!task || task.status === 'completed' || task.status === 'failed') return;
    const start = new Date(task.createdAt);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [task]);

  const onSubtaskUpdate = useCallback(({ subtask }) => {
    setSubtasks(prev => {
      const exists = prev.findIndex(s => s._id === subtask.id || s.title === subtask.title);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = { ...next[exists], ...subtask, status: subtask.status };
        return next;
      }
      return [...prev, { _id: subtask.id, ...subtask }];
    });
  }, []);

  const onTaskCompleted = useCallback(({ taskId: id, progress, reportId }) => {
    if (id === taskId) {
      setTask(t => ({ ...t, status: 'completed', progress: 100, report: { _id: reportId } }));
    }
  }, [taskId]);

  const onTaskProgress = useCallback(({ taskId: id, progress }) => {
    if (id === taskId) setTask(t => ({ ...t, progress }));
  }, [taskId]);

  const onReportReady = useCallback(({ taskId: id, reportId }) => {
    if (id === taskId) setTask(t => ({ ...t, report: { _id: reportId } }));
  }, [taskId]);

  const onTaskFailed = useCallback(({ taskId: id, error, reportId }) => {
    if (id === taskId) {
      setTask(t => ({ ...t, status: 'failed', progress: 0, error, report: reportId ? { _id: reportId } : t.report }));
    }
  }, [taskId]);

  useEffect(() => {
    joinTaskRoom(taskId);
    on('subtask:started', onSubtaskUpdate);
    on('subtask:completed', onSubtaskUpdate);
    on('task:completed', onTaskCompleted);
    on('task:progress', onTaskProgress);
    on('report:ready', onReportReady);
    on('task:failed', onTaskFailed);
    return () => {
      leaveTaskRoom(taskId);
      off('subtask:started', onSubtaskUpdate);
      off('subtask:completed', onSubtaskUpdate);
      off('task:completed', onTaskCompleted);
      off('task:progress', onTaskProgress);
      off('report:ready', onReportReady);
      off('task:failed', onTaskFailed);
    };
  }, [taskId, joinTaskRoom, leaveTaskRoom, on, off, onSubtaskUpdate, onTaskCompleted, onTaskProgress, onReportReady, onTaskFailed]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-brand-400 mx-auto mb-4" />
        <p className="text-white/40 text-sm font-medium tracking-wide uppercase">Initializing Workspace...</p>
      </div>
    </div>
  );

  if (!task) return (
    <div className="p-8 text-center mt-20">
      <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
        <Search size={24} className="text-white/20" />
      </div>
      <p className="text-white/40 mb-6 font-medium">Task could not be located in the database.</p>
      <Link to="/tasks" className="btn-secondary inline-flex px-6 py-2.5 rounded-xl">Return to Dashboard</Link>
    </div>
  );

  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const isActive = ['pending', 'queued', 'processing', 'in_progress'].includes(task.status);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <Link to="/tasks" className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide uppercase text-white/40 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </Link>

      {/* Task Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-2 border border-white/10 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {isActive && (
                  <span className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" /> Live
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">{task.title}</h1>
              <p className="text-white/60 text-[15px] leading-relaxed max-w-3xl">{task.description}</p>
            </div>
            <div className="text-left md:text-right flex-shrink-0 bg-black/20 p-4 rounded-2xl border border-white/5">
              {isActive && (
                <div className="text-sm font-semibold text-white/50 mb-1.5 flex items-center md:justify-end gap-2">
                  <Clock size={14} /> {elapsed}s execution time
                </div>
              )}
              <div className="text-[13px] font-medium text-white/30 uppercase tracking-wide">
                Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Progress Bar Area */}
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold tracking-wide uppercase text-white/60">
                {isActive
                  ? <span className="flex items-center gap-2"><Zap size={14} className="text-brand-400" /> AI Workforce Active</span>
                  : task.status === 'completed' ? <span className="text-emerald-400 flex items-center gap-2"><CheckCircle2 size={14}/> Operations Complete</span> : <span className="text-red-400 flex items-center gap-2"><XCircle size={14}/> Operations Failed</span>}
              </span>
              <span className="text-lg font-black text-white">{task.progress ?? 0}%</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)]
                  ${task.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                    task.status === 'failed'    ? 'bg-red-500'     :
                    'bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400'}`}
                style={{ width: `${task.progress ?? 0}%` }}
              />
            </div>
            {subtasks.length > 0 && (
              <div className="flex items-center justify-between mt-3 text-[13px] font-medium text-white/40">
                <span>{completedCount} of {subtasks.length} specific tasks completed</span>
                {isActive && <span>{subtasks.filter(s => s.status === 'running').length} agent(s) currently working</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agents Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">Autonomous Workforce</h2>
          <p className="text-[13px] text-white/40 font-medium">Monitoring the parallel specialist agent swarm in real-time</p>
        </div>
        {task.report && (
          <Link to={`/reports/${task.report._id || task.report}`}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold rounded-2xl shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2 group">
            <FileText size={16} /> Read Executive Report <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Agents Grid */}
      <div className="grid md:grid-cols-2 gap-6 relative">
        {/* Glow behind grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl max-h-2xl bg-brand-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
        
        {Object.entries(AGENT_META).map(([type, meta]) => {
          const agentSubtasks = subtasks.filter(s => s.agentType === type);
          const currentSubtask = agentSubtasks.length > 0 ? agentSubtasks[agentSubtasks.length - 1] : null;
          
          return (
            <PremiumAgentCard 
              key={type} 
              meta={meta} 
              subtask={currentSubtask} 
              isActive={isActive} 
            />
          );
        })}
      </div>
    </div>
  );
}
