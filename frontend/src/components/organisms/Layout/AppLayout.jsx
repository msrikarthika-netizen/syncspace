import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, LayoutDashboard, ListTodo, Bot, FileText, LogOut,
  Settings, ChevronRight, Wifi, WifiOff, Command
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/command-center', icon: Command, label: 'Command Center' },
  { to: '/tasks', icon: ListTodo, label: 'My Tasks' },
  { to: '/agents', icon: Bot, label: 'Agent Monitor' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
          {NAV.map(({ to, icon: Icon, label }) => {
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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <img src={user?.avatar} alt={user?.username}
              className="w-7 h-7 rounded-full bg-surface-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-white/30 capitalize truncate">{user?.role}</p>
            </div>
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-surface">
        {children}
      </main>
    </div>
  );
}
