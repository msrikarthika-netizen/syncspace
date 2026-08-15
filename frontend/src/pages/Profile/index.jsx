import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../apis';

const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

function cleanName(value) {
  return value
    .replace(/[^A-Za-z ]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 50);
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(user?.username || ''), [user?.username]);

  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const isValid = normalizedName.length >= 2
    && normalizedName.length <= 50
    && NAME_PATTERN.test(normalizedName);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) {
      toast.error('Use letters and spaces only for your name.');
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.updateProfile({ username: normalizedName });
      updateUser(response.data.data);
      setName(response.data.data.username);
      toast.success('Profile name updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-surface px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-surface-1 p-6 shadow-xl shadow-black/10 sm:p-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <img src={user?.avatar} alt="" className="h-16 w-16 rounded-full bg-surface-3 object-cover" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Account profile</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Your profile</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="profile-name" className="label">Name</label>
              <div className="relative">
                <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(cleanName(event.target.value))}
                  className="input w-full pl-11"
                  autoComplete="name"
                  maxLength={50}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-white/35">Letters and spaces only, 2–50 characters.</p>
            </div>

            <div>
              <label className="label">Email</label>
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">{user?.email}</p>
            </div>

            <button type="submit" disabled={saving || !isValid} className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Check size={16} /> Save changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
