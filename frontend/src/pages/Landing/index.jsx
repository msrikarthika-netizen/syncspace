import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ClipboardList,
  Code2,
  FileText,
  GitBranch,
  Menu,
  PenLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import aiOperationsRoom from '../../assets/ai-operations-room.png';
import aiWorkspaceCollaboration from '../../assets/ai-workspace-collaboration.png';
import aiWorkspaceHero from '../../assets/ai-workspace-hero-4k.png';

const phrases = [
  'Welcome to the AI Workspace.',
  'Your specialists are ready.',
  'Move Work Forward.',
];

const workflow = [
  ['01', 'Frame the decision', 'Give the work a sharp outcome, priority, and context.'],
  ['02', 'Activate the right minds', 'A central AI coordinates specialist agents around the same brief.'],
  ['03', 'Read the complete picture', 'Receive a report with the work, the reasoning, and the next move.'],
];

const agents = [
  { label: 'Research', icon: Search, x: 50, y: 7, tone: 'bg-sky-300 text-slate-950' },
  { label: 'Analysis', icon: BarChart3, x: 84, y: 29, tone: 'bg-emerald-300 text-emerald-950' },
  { label: 'Build', icon: Code2, x: 84, y: 71, tone: 'bg-violet-300 text-violet-950' },
  { label: 'Writing', icon: PenLine, x: 50, y: 93, tone: 'bg-amber-300 text-amber-950' },
  { label: 'Planning', icon: ClipboardList, x: 16, y: 71, tone: 'bg-rose-300 text-rose-950' },
  { label: 'Review', icon: Check, x: 16, y: 29, tone: 'bg-lime-300 text-lime-950' },
];

function Logo({ dark = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 text-base font-extrabold tracking-[-0.035em] ${dark ? 'text-[#10201b]' : 'text-white'}`} aria-label="SyncSpace home">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dfff75] text-sm font-black text-[#10201b] shadow-[0_0_0_5px_rgba(223,255,117,0.12)]">S</span>
      SyncSpace
    </Link>
  );
}

function AgentConstellation() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]" aria-label="Central AI connected to six specialist agents">
      <div className="absolute inset-[3%] rounded-full border border-white/10" />
      <div className="absolute inset-[19%] rounded-full border border-[#dfff75]/20" />
      <div data-orbit className="absolute inset-[31%] rounded-full border border-dashed border-white/20" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
        {agents.map((agent) => <line key={agent.label} x1="50" y1="50" x2={agent.x} y2={agent.y} stroke="rgba(223,255,117,0.36)" strokeWidth="0.28" />)}
        <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.25" />
      </svg>
      {agents.map(({ label, icon: Icon, x, y, tone }) => (
        <div key={label} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}>
          <div className={`grid h-14 w-14 place-items-center rounded-full border-4 border-[#11251a] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-transform duration-500 hover:scale-110 sm:h-[72px] sm:w-[72px] ${tone}`}>
            <Icon size={21} strokeWidth={2} />
          </div>
          <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-white/70 sm:text-[10px]">{label}</span>
        </div>
      ))}
      <div data-core className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#dfff75] text-[#10201b] shadow-[0_0_0_12px_rgba(223,255,117,0.08),0_0_70px_rgba(223,255,117,0.32)] sm:h-36 sm:w-36">
        <div className="text-center"><BrainCircuit className="mx-auto" size={30} strokeWidth={1.8} /><span className="mt-2 block text-[10px] font-black uppercase tracking-[0.16em]">Core AI</span></div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const rootRef = useRef(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [characters, setCharacters] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const phrase = phrases[phraseIndex];
  const phraseComplete = characters === phrase.length;

  useEffect(() => {
    const atStart = characters === 0;
    const delay = deleting ? 38 : phraseComplete ? 1450 : 70;
    const timer = window.setTimeout(() => {
      if (phraseComplete && !deleting) setDeleting(true);
      else if (atStart && deleting) {
        setPhraseIndex((current) => (current + 1) % phrases.length);
        setDeleting(false);
      } else setCharacters((current) => current + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [characters, deleting, phraseComplete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.to('[data-hero-image]', { scale: 1.065, duration: 16, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('[data-orbit]', { rotate: 360, duration: 28, repeat: -1, ease: 'none', transformOrigin: 'center' });
      gsap.to('[data-core]', { scale: 1.045, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, rootRef);
    return () => context.revert();
  }, []);

  const workspacePath = isAuthenticated ? '/dashboard' : '/register';

  return (
    <main ref={rootRef} className="min-h-screen overflow-hidden bg-[#f1f5f1] text-[#10201b] selection:bg-[#dfff75]">
      <section className="relative isolate min-h-[780px] overflow-hidden bg-[#0b1711] text-white lg:min-h-screen">
        <img data-hero-image src={aiWorkspaceHero} alt="AI workspace team collaborating around a connected task display" className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 -z-10 bg-[#06100b]/58" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-3/5 bg-[#06100b]/78" />

        <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex"><a href="#workflow" className="hover:text-[#dfff75]">How it works</a><a href="#agents" className="hover:text-[#dfff75]">AI network</a><a href="#experience" className="hover:text-[#dfff75]">Experience</a></div>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="hidden rounded-full border border-white/35 px-4 py-2 text-sm font-bold transition-all hover:border-[#dfff75] hover:bg-[#dfff75] hover:text-[#10201b] sm:inline-flex">{isAuthenticated ? 'Open workspace' : 'Sign in'}</Link>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 sm:hidden" aria-label="Open SyncSpace"><Menu size={18} /></Link>
        </nav>

        <div className="mx-auto flex min-h-[690px] max-w-[1440px] flex-col justify-end px-5 pb-8 pt-24 sm:px-8 lg:min-h-[calc(100vh-88px)] lg:px-12 lg:pb-11">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#dfff75]"><span className="h-2 w-2 rounded-full bg-[#dfff75]" /> An intelligent operating space</p>
          <h1 className="max-w-5xl text-[clamp(4.1rem,10.5vw,10rem)] font-extrabold leading-[0.8] tracking-[-0.075em]">SyncSpace<br /><span className="text-[#dfff75]">moves work forward.</span></h1>
          <p className="mt-7 min-h-7 text-lg font-semibold text-white/90 sm:text-xl" aria-live="polite">{phrase.slice(0, characters)}<span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-[#dfff75] align-[-2px]" /></p>
          <div className="mt-9 grid gap-7 border-t border-white/25 pt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <p className="max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">A single place to brief the work, coordinate AI specialists, and receive the finished result with its full context intact.</p>
            <div className="flex flex-wrap gap-3"><Link to={workspacePath} className="inline-flex items-center gap-2 rounded-full bg-[#dfff75] px-5 py-3 text-sm font-black text-[#10201b] transition-transform hover:-translate-y-0.5">Create a workspace <ArrowRight size={17} /></Link><a href="#agents" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-bold hover:bg-white hover:text-[#10201b]">Meet the AI network <ArrowDownRight size={17} /></a></div>
          </div>
          <div className="mt-9 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/50"><span>Brief. Coordinate. Decide.</span><span className="hidden sm:block">Scroll to explore</span></div>
        </div>
      </section>

      <section className="border-y border-[#10201b]/10 bg-[#dfff75] px-5 py-5 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-12 gap-y-3 text-xs font-bold uppercase tracking-[0.12em] text-[#10201b]"><span>AI workspace</span><span>Connected agents</span><span>Visible delivery</span><span>Manager-ready reports</span></div></section>

      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-36"><div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">The SyncSpace standard</p><h2 className="mt-5 max-w-md text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-6xl">The work should be as clear as the decision it supports.</h2></div><p className="max-w-2xl border-l-2 border-[#dfff75] pl-6 text-xl leading-8 text-[#4e6257] sm:text-2xl sm:leading-9">SyncSpace brings the brief, the AI team, the work in progress, and the report into one uninterrupted operating rhythm.</p></div></section>

      <section id="workflow" className="bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-[1360px]"><div className="flex flex-col justify-between gap-6 border-b border-[#10201b]/12 pb-10 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">The workflow</p><h2 className="mt-4 text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl">Good work has a shape.</h2></div><p className="max-w-sm text-sm leading-6 text-[#53675d]">A deliberate path for every assignment, from the first thought to the final response.</p></div><div className="divide-y divide-[#10201b]/12">{workflow.map(([number, title, body]) => <article key={number} className="grid gap-4 py-8 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,0.75fr)] sm:items-center sm:py-12"><span className="text-4xl font-black tracking-[-0.08em] text-[#dfff75] sm:text-6xl">{number}</span><h3 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{title}</h3><p className="max-w-md text-sm leading-6 text-[#53675d]">{body}</p></article>)}</div></div></section>

      <section id="agents" className="relative overflow-hidden bg-[#11251a] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-36"><div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#dfff75]/[0.05] blur-3xl" /><div className="relative mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfff75]">The central intelligence</p><h2 className="mt-5 text-4xl font-extrabold leading-[0.96] tracking-[-0.055em] sm:text-6xl">One central AI. A team that communicates.</h2><p className="mt-7 max-w-lg text-base leading-7 text-white/65 sm:text-lg">The Core AI holds the brief, routes work to specialist agents, and keeps every contribution connected to the manager’s final report.</p><div className="mt-9 space-y-4 border-t border-white/15 pt-7 text-sm text-white/70"><p className="flex gap-3"><Bot className="mt-0.5 text-[#dfff75]" size={18} /> Shared context, not fragmented prompts.</p><p className="flex gap-3"><GitBranch className="mt-0.5 text-[#dfff75]" size={18} /> Clear hand-offs between every specialist.</p><p className="flex gap-3"><FileText className="mt-0.5 text-[#dfff75]" size={18} /> A complete, decision-ready delivery.</p></div></div><AgentConstellation /></div></section>

      <section id="experience" className="bg-[#f1f5f1] px-5 py-24 sm:px-8 lg:px-12 lg:py-36"><div className="mx-auto max-w-[1360px]"><div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Built for real work</p><h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-6xl">An AI workspace that feels present, not performative.</h2></div><p className="max-w-md text-base leading-7 text-[#53675d]">Premium work deserves a calm surface. Every moment is designed for scanning, deciding, and moving on.</p></div><div className="mt-14 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"><figure className="group relative min-h-[460px] overflow-hidden bg-[#10201b] sm:min-h-[640px]"><img src={aiWorkspaceCollaboration} alt="AI workspace collaboration" className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-105" /><figcaption className="absolute inset-x-0 bottom-0 bg-[#10201b]/90 p-6 text-white sm:p-8"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfff75]">Shared intelligence</span><p className="mt-3 max-w-xl text-xl font-bold leading-8">The work remains grounded in people, priorities, and a clear point of view.</p></figcaption></figure><div className="flex min-h-[460px] flex-col justify-between bg-[#dfff75] p-7 text-[#10201b] sm:min-h-[640px] sm:p-9"><Sparkles size={27} /><div><span className="text-xs font-black uppercase tracking-[0.16em]">The manager view</span><p className="mt-5 text-3xl font-extrabold leading-[1.03] tracking-[-0.045em]">See exactly what matters. Leave the rest in motion.</p></div><p className="border-t border-[#10201b]/20 pt-5 text-sm leading-6 text-[#10201b]/75">Every finished assignment becomes a report your team can use, review, and build on.</p></div></div></div></section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-2 lg:items-center lg:gap-20"><figure className="group relative min-h-[440px] overflow-hidden bg-[#10201b] sm:min-h-[590px]"><img src={aiOperationsRoom} alt="AI operations room" className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-105" /><div className="absolute left-6 top-6 inline-flex items-center gap-2 bg-[#10201b]/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"><span className="h-2 w-2 rounded-full bg-[#dfff75]" /> Intelligence in motion</div></figure><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">No black box</p><h2 className="mt-5 text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-6xl">The right level of detail, at every step.</h2><div className="mt-10 grid gap-6 sm:grid-cols-2"><div className="border-t border-[#10201b]/15 pt-5"><span className="text-sm font-black text-emerald-800">01</span><h3 className="mt-4 text-lg font-bold">Visible activity</h3><p className="mt-2 text-sm leading-6 text-[#53675d]">Know what every agent is working on as the assignment progresses.</p></div><div className="border-t border-[#10201b]/15 pt-5"><span className="text-sm font-black text-emerald-800">02</span><h3 className="mt-4 text-lg font-bold">Connected output</h3><p className="mt-2 text-sm leading-6 text-[#53675d]">Every output stays connected to the brief and the final recommendation.</p></div></div><Link to={workspacePath} className="mt-10 inline-flex items-center gap-2 border-b-2 border-[#10201b] pb-2 text-sm font-black hover:border-emerald-700 hover:text-emerald-700">Open the AI workspace <ArrowUpRight size={17} /></Link></div></div></section>

      <section id="start" className="bg-[#dfff75] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-9 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-900">Your next assignment</p><h2 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.85] tracking-[-0.07em] text-[#10201b] sm:text-7xl">Make it clear.<br />Move it forward.</h2></div><Link to={workspacePath} className="inline-flex w-fit items-center gap-3 rounded-full bg-[#10201b] px-6 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5">Create your workspace <ArrowRight size={18} /></Link></div></section>

      <footer className="bg-[#0b1711] px-5 py-14 text-white sm:px-8 lg:px-12 lg:py-20"><div className="mx-auto grid max-w-[1360px] gap-12 border-b border-white/15 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><Logo /><p className="mt-5 max-w-xs text-sm leading-6 text-white/55">SyncSpace is the AI workspace for teams that want every important assignment to reach a real conclusion.</p></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfff75]">Product</p><div className="mt-5 space-y-3 text-sm text-white/60"><a href="#workflow" className="block hover:text-white">How it works</a><a href="#agents" className="block hover:text-white">AI network</a><a href="#experience" className="block hover:text-white">Experience</a></div></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfff75]">Company</p><div className="mt-5 space-y-3 text-sm text-white/60"><a href="#start" className="block hover:text-white">About</a><Link to="/register" className="block hover:text-white">Create workspace</Link><Link to="/login" className="block hover:text-white">Sign in</Link></div></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dfff75]">Contact</p><div className="mt-5 space-y-3 text-sm text-white/60"><a className="block hover:text-white" href="mailto:hello@syncspace.ai">hello@syncspace.ai</a><a className="block hover:text-white" href="mailto:support@syncspace.ai">support@syncspace.ai</a><span className="block">Global, remote-first</span></div></div></div><div className="mx-auto flex max-w-[1360px] flex-col gap-4 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 SyncSpace. All rights reserved.</span><div className="flex gap-5"><a href="#start" className="hover:text-white">Privacy</a><a href="#start" className="hover:text-white">Terms</a><a href="mailto:hello@syncspace.ai" className="hover:text-white">Contact</a></div></div></footer>
    </main>
  );
}
