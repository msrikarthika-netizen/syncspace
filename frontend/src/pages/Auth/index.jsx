import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../apis';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Welcome back" subtitle="Sign in to your SyncSpace account">
    <form onSubmit={handle} className="space-y-5">
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input className="input pr-11" type={showPass ? 'text' : 'password'} placeholder="••••••••"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setShowPass(s => !s)}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign in'}
      </button>
      <p className="text-center text-sm text-white/40">
        No account? <Link to="/register" className="text-brand-400 hover:text-brand-300">Create one free</Link>
      </p>
    </form>
  </AuthLayout>;
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'manager' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('Account created — welcome to SyncSpace!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Create account" subtitle="Start delegating tasks to AI agents">
    <form onSubmit={handle} className="space-y-5">
      <div>
        <label className="label">Username</label>
        <input className="input" placeholder="e.g. john_manager"
          value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input className="input pr-11" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setShowPass(s => !s)}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="label">I am a</label>
        <div className="grid grid-cols-2 gap-3">
          {[['manager', 'Manager — assign tasks'], ['member', 'Member — view & report']].map(([v, l]) => (
            <button key={v} type="button"
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all
                ${form.role === v ? 'border-brand-500 bg-brand-500/15 text-brand-300' : 'border-white/10 bg-surface-2 text-white/50 hover:border-white/20'}`}
              onClick={() => setForm(f => ({ ...f, role: v }))}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create account'}
      </button>
      <p className="text-center text-sm text-white/40">
        Already have one? <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
      </p>
    </form>
  </AuthLayout>;
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
          <BrainCircuit size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">SyncSpace</span>
      </Link>
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        <p className="text-white/50 text-sm mb-8">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
