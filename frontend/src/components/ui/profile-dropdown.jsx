import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, FileText, LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

function avatarFor(user) {
  return user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'syncspace')}`;
}

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.username || 'Workspace member';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-400/50"
          aria-label="Open profile menu"
        >
          <img src={avatarFor(user)} alt="" className="h-8 w-8 flex-shrink-0 rounded-full bg-surface-3 object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{displayName}</span>
            <span className="block truncate text-xs capitalize text-white/30">{user?.role || 'member'}</span>
          </span>
          <ChevronDown size={14} className="flex-shrink-0 text-white/30 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" sideOffset={10} className="w-64 rounded-2xl border-white/10 bg-surface-2/95 p-2 backdrop-blur-xl">
        <div className="border-b border-white/10 px-3 pb-3 pt-2">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-white/40">{user?.email || 'No email available'}</p>
        </div>

        <div className="space-y-1 py-2">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex w-full items-center gap-3 text-white/75 hover:text-white">
              <User size={16} /> <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/subscription" className="flex w-full items-center gap-3 text-white/75 hover:text-white">
              <CreditCard size={16} /> <span>Subscription</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex w-full items-center gap-3 text-white/75 hover:text-white">
              <Settings size={16} /> <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="https://syncspace.ai/terms" target="_blank" rel="noreferrer" className="flex w-full items-center gap-3 text-white/75 hover:text-white">
              <FileText size={16} /> <span>Terms &amp; policies</span>
            </a>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="gap-3 text-red-300 focus:bg-red-500/10 focus:text-red-200">
          <LogOut size={16} /> <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
