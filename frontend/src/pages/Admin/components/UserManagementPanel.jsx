import { Search, Shield, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { AdminSection, LoadingRows, Pagination, PanelError, RefreshButton, StatusPill } from './AdminPrimitives';

export default function UserManagementPanel({ data, loading, error, onLoad, onRoleChange, onStatusChange }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const applyFilters = (page = 1) => onLoad({ page, search, role, isActive: status });

  return (
    <AdminSection id="users" title="User management" description="Review identities, workspace roles, and account access." action={<RefreshButton loading={loading} onClick={() => applyFilters(data.page)} />}>
      <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }} className="mb-4 grid gap-2 lg:grid-cols-[1fr_150px_150px_auto]">
        <label className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-300/50" placeholder="Search name or email" /></label>
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-white/10 bg-[#171822] px-3 text-sm text-white outline-none focus:border-violet-300/50"><option value="">All roles</option><option value="member">Member</option><option value="manager">Manager</option><option value="admin">Admin</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#171822] px-3 text-sm text-white outline-none focus:border-violet-300/50"><option value="">All accounts</option><option value="true">Active</option><option value="false">Suspended</option></select>
        <button type="submit" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#151620] transition hover:bg-violet-100">Apply</button>
      </form>
      {error ? <PanelError message={error} retry={() => applyFilters(data.page)} /> : loading && !data.items.length ? <LoadingRows rows={5} /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-white/30"><tr><th className="px-3 py-3">User</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Activity</th><th className="px-3 py-3">Created</th><th className="px-3 py-3 text-right">Controls</th></tr></thead>
            <tbody>{data.items.map((user) => <tr key={user.id} className="border-b border-white/[0.06] last:border-0"><td className="px-3 py-3"><div className="flex items-center gap-3"><img src={user.avatar} alt="" className="h-8 w-8 rounded-full bg-white/10" /><div><p className="font-semibold text-white">{user.username}</p><p className="text-xs text-white/35">{user.email}</p></div></div></td><td className="px-3 py-3"><select aria-label={`Change role for ${user.username}`} value={user.role} onChange={(event) => onRoleChange(user, event.target.value)} className="rounded-lg border border-white/10 bg-[#171822] px-2 py-1.5 text-xs font-semibold capitalize text-white outline-none"><option value="member">Member</option><option value="manager">Manager</option><option value="admin">Admin</option></select></td><td className="px-3 py-3"><StatusPill status={user.isActive === false ? 'suspended' : 'healthy'} /></td><td className="px-3 py-3 text-xs text-white/40">{new Date(user.createdAt).toLocaleDateString()}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => onStatusChange(user, user.isActive === false)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${user.isActive === false ? 'border-emerald-300/20 text-emerald-200 hover:bg-emerald-300/10' : 'border-red-300/20 text-red-200 hover:bg-red-300/10'}`}>{user.isActive === false ? <UserCheck size={13} /> : <UserX size={13} />}{user.isActive === false ? 'Restore' : 'Suspend'}</button></td></tr>)}</tbody>
          </table>
          {!data.items.length && <div className="py-10 text-center text-sm text-white/35"><Shield className="mx-auto mb-3 text-white/20" size={22} />No users match the selected filters.</div>}
        </div>
      )}
      <Pagination {...data} onPageChange={applyFilters} />
    </AdminSection>
  );
}
