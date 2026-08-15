import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const navigation = [
  { href: '#overview', label: 'Overview', icon: LayoutDashboard },
  { href: '#users', label: 'Users', icon: Users },
  { href: '#moderation', label: 'Moderation', icon: FileWarning },
  { href: '#monitoring', label: 'AI monitoring', icon: Activity },
  { href: '#audit-logs', label: 'Audit logs', icon: ClipboardList },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#10111a] lg:fixed lg:inset-y-0 lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 shadow-lg shadow-violet-900/30">
            <ShieldCheck size={21} />
          </div>
          <div>
            <p className="font-bold tracking-tight">SyncSpace</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/70">Administration</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Admin navigation">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Control center</p>
          {navigation.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/60">
              <Icon size={17} className="text-violet-200" /> {label}
            </a>
          ))}
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
            <p className="truncate text-sm font-semibold text-white">{user?.username || 'Administrator'}</p>
            <p className="mt-1 text-xs capitalize text-white/35">{user?.role || 'admin'} account</p>
          </div>
          <Link to="/dashboard" className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft size={16} /> Back to workspace
          </Link>
          <button type="button" onClick={logout} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10">
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0b0c12]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
            <BrainCircuit size={17} className="text-violet-200" />
            <span>Administrative control center</span>
          </div>
          <Link to="/dashboard" className="rounded-lg px-2 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-white/[0.06] lg:hidden">
            Workspace
          </Link>
          <span className="hidden text-xs text-white/35 sm:block">{location.pathname === '/admin' ? 'Restricted access' : 'Administration'}</span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
