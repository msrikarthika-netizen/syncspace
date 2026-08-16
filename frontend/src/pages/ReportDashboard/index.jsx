import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import { ArrowLeft, Check, CheckCircle2, Clipboard, Clock3, FileText, GitBranch, Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { reportsAPI } from '../../apis';

const LANGUAGE_ALIASES = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash', html: 'markup' };
const AGENT_STYLES = {
  research: 'from-cyan-400/20 to-blue-500/5 border-cyan-400/20 text-cyan-200',
  analysis: 'from-emerald-400/20 to-teal-500/5 border-emerald-400/20 text-emerald-200',
  coding: 'from-violet-400/20 to-fuchsia-500/5 border-violet-400/20 text-violet-200',
  writing: 'from-amber-400/20 to-orange-500/5 border-amber-400/20 text-amber-200',
  general: 'from-slate-400/20 to-slate-500/5 border-slate-400/20 text-slate-200',
};

function downloadReport(report) {
  const blob = new Blob([report.fullContent || report.summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.title.replace(/\s+/g, '_')}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function CodeBlock({ language = 'text', code }) {
  const [copied, setCopied] = useState(false);
  const normalizedLanguage = LANGUAGE_ALIASES[language.toLowerCase()] || language.toLowerCase();
  const grammar = Prism.languages[normalizedLanguage] || Prism.languages.markup;
  const highlighted = useMemo(
    () => Prism.highlight(code.trim(), grammar, normalizedLanguage),
    [code, grammar, normalizedLanguage]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Unable to copy code');
    }
  };

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">{normalizedLanguage}</span>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/55 transition hover:bg-white/10 hover:text-white">
          {copied ? <Check size={13} className="text-emerald-300" /> : <Clipboard size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[32rem] overflow-auto p-4 text-[13px] leading-6 text-slate-100"><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}

function MermaidDiagram({ diagram }) {
  const id = useId().replace(/:/g, '');
  const host = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'dark',
          themeVariables: { primaryColor: '#6a47ee', primaryTextColor: '#f0efeb', lineColor: '#8875b8' },
        });
        const { svg } = await mermaid.render(`report-diagram-${id}`, diagram.trim());
        if (active && host.current) host.current.innerHTML = svg;
      } catch {
        if (active) setError('This diagram could not be rendered.');
      }
    }
    renderDiagram();
    return () => { active = false; };
  }, [diagram, id]);

  return (
    <div className="my-5 rounded-2xl border border-brand-400/20 bg-brand-500/[0.06] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-200"><GitBranch size={14} /> Workflow diagram</div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : <div ref={host} className="overflow-x-auto [&_svg]:mx-auto [&_svg]:min-w-[34rem] [&_svg]:max-w-none" />}
    </div>
  );
}

function TextBlock({ text }) {
  return text.split('\n').filter(Boolean).map((line, index) => {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const headingStyles = {
        1: 'mt-8 text-3xl font-extrabold tracking-tight text-white',
        2: 'mt-7 text-2xl font-bold tracking-tight text-white',
        3: 'mt-6 text-xl font-bold text-white',
        4: 'mt-6 text-lg font-bold text-brand-100',
        5: 'mt-5 text-base font-semibold text-white/90',
        6: 'mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-white/65',
      };
      const Tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      return <Tag key={index} className={headingStyles[level]}>{heading[2]}</Tag>;
    }
    if (/^[-*] /.test(line)) return <div key={index} className="flex gap-3 py-1.5 text-sm leading-7 text-white/70"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-300" />{line.slice(2)}</div>;
    return <p key={index} className="py-1.5 text-sm leading-7 text-white/70">{line.replace(/\*\*/g, '')}</p>;
  });
}

function RichContent({ content }) {
  const blocks = [];
  const fence = /```([^\n]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match;
  while ((match = fence.exec(content || '')) !== null) {
    if (match.index > cursor) blocks.push({ type: 'text', value: content.slice(cursor, match.index) });
    blocks.push({ type: match[1].trim().toLowerCase() === 'mermaid' ? 'mermaid' : 'code', language: match[1].trim() || 'text', value: match[2] });
    cursor = fence.lastIndex;
  }
  if (cursor < (content || '').length) blocks.push({ type: 'text', value: content.slice(cursor) });
  if (!blocks.length) return <p className="text-sm text-white/50">No content was generated for this section.</p>;
  return blocks.map((block, index) => {
    if (block.type === 'code') return <CodeBlock key={index} language={block.language} code={block.value} />;
    if (block.type === 'mermaid') return <MermaidDiagram key={index} diagram={block.value} />;
    return <TextBlock key={index} text={block.value} />;
  });
}

export default function ReportDashboardPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.getById(reportId)
      .then((response) => setReport(response.data.data))
      .catch(() => toast.error('Failed to load report dashboard'))
      .finally(() => setLoading(false));
  }, [reportId]);

  const sections = report?.sections || [];
  const stats = report?.stats || {};

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 size={30} className="animate-spin text-brand-300" /></div>;
  if (!report) return <div className="p-8 text-center text-white/50">Report dashboard not found.</div>;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(106,71,238,0.18),transparent_30%),radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.09),transparent_25%)] px-4 py-6 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link to={`/reports/${reportId}`} className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"><ArrowLeft size={15} /> Back to report</Link>
          <button onClick={() => downloadReport(report)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10">Download source</button>
        </div>

        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#141427]/90 p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200"><CheckCircle2 size={13} /> Generated report dashboard</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{report.title.replace(/^AI Report:\s*/i, '')}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">{report.summary}</p>
            <p className="mt-5 text-xs text-white/35">Generated {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })} · {stats.workflowRoute || 'complex'} workflow</p>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Users, label: 'Contributors', value: stats.totalSubtasks || 0, tint: 'text-violet-200' },
              { icon: CheckCircle2, label: 'Completed work', value: stats.completedSubtasks || 0, tint: 'text-emerald-200' },
              { icon: Clock3, label: 'Execution time', value: `${((stats.totalDurationMs || 0) / 1000).toFixed(1)}s`, tint: 'text-cyan-200' },
            ].map(({ icon: Icon, label, value, tint }) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><Icon size={17} className={tint} /><p className="mt-3 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">{label}</p></div>)}
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="hidden lg:block"><div className="sticky top-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Report map</p>{sections.map((section, index) => <a key={`${section.heading}-${index}`} href={`#section-${index}`} className="block rounded-lg px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">{index + 1}. {section.heading}</a>)}</div></aside>
          <main className="space-y-5">
            {sections.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-white/55">This report has no specialist sections.</div> : sections.map((section, index) => {
              const agentType = section.agentType || section.agent_type || 'general';
              const agentName = section.agentName || section.agent_name || 'AI contributor';
              const style = AGENT_STYLES[agentType] || AGENT_STYLES.general;
              return <article id={`section-${index}`} key={`${section.heading}-${index}`} className={`scroll-mt-6 overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${style}`}>
                <div className="border-b border-white/10 bg-black/10 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/25 bg-white/10 text-xs font-bold">{index + 1}</span><div><p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-70">{agentName}</p><h2 className="mt-0.5 text-lg font-bold text-white">{section.heading}</h2></div></div></div>
                <div className="bg-[#12121f]/90 px-5 py-5 sm:px-7 sm:py-6"><RichContent content={section.content} /></div>
              </article>;
            })}
            {stats.ragSources?.length > 0 && <section className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200"><FileText size={14} /> Curated knowledge used</div><div className="flex flex-wrap gap-2">{stats.ragSources.map((source) => <span key={`${source.sourceKey}-${source.chunkIndex}`} className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs text-cyan-100/80">{source.title}</span>)}</div></section>}
          </main>
        </div>
      </div>
    </div>
  );
}
