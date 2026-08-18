import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../apis';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { firebaseAuth } from '../../config/firebase';
import toast from 'react-hot-toast';

const authErrorMessage = (err, fallback) => {
  if (err.response?.data?.message) return err.response.data.message;
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Please allow popups and try again.',
  };
  return messages[err.code] || fallback;
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, form.email, form.password);
      const idToken = await credential.user.getIdToken();
      const res = await authAPI.firebaseSession({ idToken, username: credential.user.displayName || undefined });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(authErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const res = await authAPI.firebaseSession({ idToken, username: credential.user.displayName || undefined });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(authErrorMessage(err, 'Google sign-in failed'));
    } finally {
      setGoogleLoading(false);
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
      <div className="flex items-center gap-3 text-xs text-white/30"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
      <button type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleMark />}
        {googleLoading ? 'Opening Google...' : 'Continue with Google'}
      </button>
      <p className="text-center text-sm text-white/40">
        No account? <Link to="/register" className="text-brand-400 hover:text-brand-300">Create one free</Link>
      </p>
    </form>
  </AuthLayout>;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.7H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1.9 4.3l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.9 7.7l3.3 2.6C7 7.8 9.3 6 12 6Z" />
    </svg>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'manager' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
      await updateFirebaseProfile(credential.user, { displayName: form.username });
      const idToken = await credential.user.getIdToken();
      await authAPI.firebaseSession({
        idToken,
        username: form.username,
        role: form.role,
        registration: true,
      });
      await sendEmailVerification(credential.user);
      await signOut(firebaseAuth);
      toast.success('Account created. Check your email to verify it, then sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(authErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Create account" subtitle="Start delegating tasks to AI agents">
    <form onSubmit={handle} className="space-y-5">
      <div>
        <label className="label">Username</label>
        <input className="input" placeholder="e.g. john_manager" pattern="[A-Za-z0-9_]{3,80}"
          title="Use 3–80 letters, numbers, or underscores."
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
