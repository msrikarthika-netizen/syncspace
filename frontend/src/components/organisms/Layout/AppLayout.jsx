import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit, LayoutDashboard, ListTodo, Bot, FileText,
  ChevronRight, Wifi, WifiOff, Command, ShieldCheck
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

export default function AppLayout({ children }) {
  const { connected } = useSocket();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navItems = isAdmin ? [...NAV, { to: '/admin', icon: ShieldCheck, label: 'Administration' }] : NAV;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-surface-1 border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <BrainCircuit size={15} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">SyncSpace</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="section-header px-2 mb-3">Workspace</p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
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
      <main className="flex-1 overflow-y-auto bg-surface">
        {children}
      </main>
    </div>
  );
}
