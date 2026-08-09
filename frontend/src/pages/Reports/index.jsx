import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText, Search, BarChart2, Clock, CheckCircle2,
  ArrowLeft, Bot, Download, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { reportsAPI } from '../../apis';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const AGENT_COLORS = {
  research: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  coding:   'text-violet-400 bg-violet-500/10 border-violet-500/20',
  writing:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  analysis: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  general:  'text-white/50 bg-white/5 border-white/10',
};

// ── Reports List ──────────────────────────────────────────────
export function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    reportsAPI.list()
      .then(res => setReports(res.data.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.task?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">All AI-generated task reports in one place.</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input className="input pl-9 py-2.5 text-sm" placeholder="Search reports..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 border-white/10 animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-2/5 mb-2" />
              <div className="h-3 bg-surface-3 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 border-white/10 text-center">
          <FileText size={32} className="mx-auto text-white/20 mb-3" />
          <h3 className="font-medium text-white/60 mb-1">No reports yet</h3>
          <p className="text-sm text-white/30">Complete a task to generate your first AI report</p>
          <Link to="/tasks/new" className="btn-primary inline-flex mt-5 text-sm">
            Assign a task
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <Link key={report._id} to={`/reports/${report._id}`}
              className="card p-5 border-white/10 flex items-start gap-4 hover:border-brand-500/30 transition-all group block">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                              flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white group-hover:text-brand-300 transition-colors truncate mb-1">
                  {report.title}
                </h3>
                <p className="text-sm text-white/40 line-clamp-2 mb-2">{report.summary}</p>
                <div className="flex items-center gap-4 text-xs text-white/25">
                  <span className="flex items-center gap-1">
                    <Bot size={11} /> {report.stats?.agentsUsed?.length || 0} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={11} /> {report.stats?.completedSubtasks || 0} subtasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                Ready
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single Report ─────────────────────────────────────────────
export function ReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    reportsAPI.getById(reportId)
      .then(res => setReport(res.data.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [reportId]);

  const toggleSection = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.fullContent || report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <Loader2 size={28} className="animate-spin text-brand-400" />
    </div>
  );

  if (!report) return (
    <div className="p-8 text-center">
      <p className="text-white/40">Report not found.</p>
      <Link to="/reports" className="btn-secondary inline-flex mt-4">Back to reports</Link>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> All reports
      </Link>

      {/* Report header */}
      <div className="card p-7 border-emerald-500/20 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Report ready
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{report.title}</h1>
            <p className="text-white/30 text-sm">
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })} ·
              {report.stats?.agentsUsed?.join(', ')}
            </p>
          </div>
          <button onClick={handleDownload}
            className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
            <Download size={14} /> Download
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Bot, label: 'Agents used', val: report.stats?.totalSubtasks || 0, color: 'text-brand-400' },
            { icon: CheckCircle2, label: 'Completed', val: report.stats?.completedSubtasks || 0, color: 'text-emerald-400' },
            { icon: Clock, label: 'Total time', val: `${((report.stats?.totalDurationMs || 0) / 1000).toFixed(1)}s`, color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="bg-surface-2/60 rounded-xl p-4 text-center">
              <Icon size={16} className={`${color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-xs text-white/30">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Executive summary */}
      <div className="card p-6 border-brand-500/20 mb-4">
        <p className="section-header mb-3">Executive Summary</p>
        <p className="text-white/70 leading-relaxed text-sm">{report.summary}</p>
      </div>

      {/* Agent sections */}
      <p className="section-header mb-3">Agent Reports</p>
      <div className="space-y-3">
        {(report.sections || []).map((sec, i) => {
          const colorClass = AGENT_COLORS[sec.agentType] || AGENT_COLORS.general;
          const isOpen = expanded[i] !== false; // default open
          return (
            <div key={i} className={`card border ${colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-white/10'}`}>
              <button
                onClick={() => toggleSection(i)}
                className="w-full p-5 flex items-center gap-3 text-left hover:bg-white/2 transition-colors rounded-2xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${colorClass}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold ${colorClass.split(' ')[0]}`}>{sec.agentName}</span>
                  </div>
                  <p className="font-medium text-white text-sm">{sec.heading}</p>
                </div>
                {isOpen ? <ChevronUp size={15} className="text-white/30 flex-shrink-0" />
                        : <ChevronDown size={15} className="text-white/30 flex-shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5">
                  <div className="divider mb-4" />
                  <div className="prose prose-sm prose-invert max-w-none">
                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed
                                   bg-surface-3/50 rounded-xl p-4 border border-white/10 overflow-auto max-h-80">
                      {sec.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
