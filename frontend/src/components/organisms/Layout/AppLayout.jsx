import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, Bot, FileText,
  ChevronRight, Wifi, WifiOff, Command, ShieldCheck, X
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import ProfileDropdown from '../../ui/profile-dropdown';
import { useAuth } from '../../../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/command-center', icon: Command, label: 'Command Center' },
  { to: '/tasks', icon: ListTodo, label: 'My Tasks' },
  { to: '/agents', icon: Bot, label: 'Agent Monitor' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

function SyncSpaceLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="29" height="29" viewBox="0 0 29 29" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="27.5" height="27.5" rx="8" fill="#6A47EE" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        <path d="M8 9.5C8 8.12 9.12 7 10.5 7h7C18.88 7 20 8.12 20 9.5S18.88 12 17.5 12h-6C10.12 12 9 13.12 9 14.5S10.12 17 11.5 17H18C19.1 17 20 17.9 20 19s-.9 2-2 2h-7" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className="font-bold text-base tracking-tight text-white">SyncSpace</span>
    </div>
  );
}

export default function AppLayout({ children }) {
  const { connected } = useSocket();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('syncspace-sidebar') !== 'closed');
  const navItems = isAdmin ? [...NAV, { to: '/admin', icon: ShieldCheck, label: 'Administration' }] : NAV;

  useEffect(() => {
    localStorage.setItem('syncspace-sidebar', sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {sidebarOpen && <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-black/60 md:hidden" />}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-xl border border-white/10 bg-surface-1 p-2 text-white/55 shadow-xl shadow-black/20 transition hover:bg-white/10 hover:text-white"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <X size={18} />
        </button>
      )}
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/10 bg-surface-1 transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)}><SyncSpaceLogo /></Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Hide sidebar"><X size={17} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="section-header px-2 mb-3">Workspace</p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150
                  ${active ? 'bg-brand-600/20 text-brand-300 border border-brand-500/25'
                           : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <Icon size={16} />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + socket status */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-1">
          {/* Socket status */}
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/30">
            {connected
              ? <><Wifi size={12} className="text-emerald-400" /> <span className="text-emerald-400">Live updates on</span></>
              : <><WifiOff size={12} className="text-red-400" /> <span className="text-red-400">Disconnected</span></>
            }
          </div>

          {/* User */}
          <ProfileDropdown />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <main className="h-screen overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
