import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserX, UserCheck, Plus, Pencil, KeyRound, RefreshCw, ShieldCheck, Store, User, Bike, Eye, EyeOff } from 'lucide-react';
import { adminUsersApi, type AdminUser, type ApiMeta } from '@/services/adminApi';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';
import { roleBadge, statusBadge } from '@/components/admin/AdminBadge';
import { fmtDate } from '@/lib/adminFormat';

const ROLES = ['ALL', 'CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] as const;
const ALL_ROLES = ['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] as const;

interface CreateForm { name: string; email: string; password: string; phone: string; role: string; }
interface EditForm { name: string; email: string; phone: string; role: string; isActive: boolean; }
interface ResetPwdForm { newPassword: string; confirmPassword: string; }
interface PwdForm { currentPassword: string; newPassword: string; confirmPassword: string; }

const EMPTY_CREATE: CreateForm = { name: '', email: '', password: '', phone: '', role: 'CUSTOMER' };
const EMPTY_EDIT: EditForm = { name: '', email: '', phone: '', role: 'CUSTOMER', isActive: true };
const EMPTY_RESET_PWD: ResetPwdForm = { newPassword: '', confirmPassword: '' };
const EMPTY_PWD: PwdForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; error?: string }> = ({ label, value, onChange, type = 'text', required, placeholder, error }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}{required && ' *'}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
      className={`w-full rounded-xl border ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400`} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ user: AdminUser; action: 'suspend' | 'activate' } | null>(null);

  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [pwdForm, setPwdForm] = useState<PwdForm>(EMPTY_PWD);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Reset user password state
  const [resetPwdForm, setResetPwdForm] = useState<ResetPwdForm>(EMPTY_RESET_PWD);
  const [resetPwdError, setResetPwdError] = useState('');
  const [resetPwdSuccess, setResetPwdSuccess] = useState(false);
  const [resetPwdSaving, setResetPwdSaving] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true); setError(null);
    try {
      const res = await adminUsersApi.list(p, 20);
      setUsers(res.data); setMeta(res.meta);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(page); }, [page]);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone ?? '').includes(search);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (createForm.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await adminUsersApi.create({ name: createForm.name, email: createForm.email, password: createForm.password, phone: createForm.phone || undefined, role: createForm.role });
      setShowCreate(false); setCreateForm(EMPTY_CREATE); await load(page);
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  };

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, isActive: u.isActive });
    setResetPwdForm(EMPTY_RESET_PWD);
    setResetPwdError('');
    setResetPwdSuccess(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return; setFormError('');
    setSaving(true);
    try {
      await adminUsersApi.update(editUser.id, {
        name: editForm.name,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        role: editForm.role,
        isActive: editForm.isActive,
      });
      setEditUser(null); await load(page);
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  };

  const pwdStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const handleResetUserPassword = async () => {
    if (!editUser) return;
    setResetPwdSaving(true); setResetPwdError('');
    try {
      await adminUsersApi.resetUserPassword(editUser.id, { newPassword: resetPwdForm.newPassword });
      setResetPwdSuccess(true);
      setResetPwdForm(EMPTY_RESET_PWD);
      setConfirmResetOpen(false);
      setTimeout(() => setResetPwdSuccess(false), 3000);
    } catch (e) { setResetPwdError((e as Error).message); setConfirmResetOpen(false); }
    finally { setResetPwdSaving(false); }
  };

  const handleToggle = async () => {
    if (!confirm) return; setSaving(true);
    try {
      await adminUsersApi.update(confirm.user.id, { isActive: confirm.action === 'activate' });
      setConfirm(null); await load(page);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdError(''); setPwdSuccess(false);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdError('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdError('New password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await adminUsersApi.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess(true); setPwdForm(EMPTY_PWD);
      setTimeout(() => { setPwdOpen(false); setPwdSuccess(false); }, 2000);
    } catch (e) { setPwdError((e as Error).message); }
    finally { setSaving(false); }
  };

  const counts = {
    CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
    VENDOR: users.filter(u => u.role === 'VENDOR').length,
    RIDER: users.filter(u => u.role === 'RIDER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    suspended: users.filter(u => !u.isActive).length,
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name', header: 'User',
      render: u => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold dark:bg-orange-900/40 dark:text-orange-300">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
            <p className="text-xs text-slate-500 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone',  header: 'Phone',  render: u => <span className="text-sm text-slate-500">{u.phone ?? '—'}</span> },
    { key: 'role',   header: 'Role',   render: u => roleBadge(u.role) },
    { key: 'status', header: 'Status', render: u => statusBadge(u.isActive) },
    { key: 'joined', header: 'Joined', render: u => <span className="text-xs text-slate-500">{fmtDate(u.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: u => (
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => openEdit(u)} title="Edit" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {u.role !== 'ADMIN' && (
            u.isActive
              ? <button onClick={() => setConfirm({ user: u, action: 'suspend' })} title="Suspend" className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><UserX className="h-3.5 w-3.5" /></button>
              : <button onClick={() => setConfirm({ user: u, action: 'activate' })} title="Activate" className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition"><UserCheck className="h-3.5 w-3.5" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
            <p className="text-sm text-slate-500">{meta?.total ?? '—'} registered users</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(page)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => { setPwdOpen(true); setPwdForm(EMPTY_PWD); setPwdError(''); setPwdSuccess(false); }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
            <KeyRound className="h-4 w-4" /> My Password
          </button>
          <button onClick={() => { setShowCreate(true); setCreateForm(EMPTY_CREATE); setFormError(''); }}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
            <Plus className="h-4 w-4" /> New User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-5">
        {[
          { label: 'Customers', value: counts.CUSTOMER, icon: <User className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' },
          { label: 'Vendors',   value: counts.VENDOR,   icon: <Store className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' },
          { label: 'Riders',    value: counts.RIDER,    icon: <Bike className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' },
          { label: 'Admins',    value: counts.ADMIN,    icon: <ShieldCheck className="h-4 w-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
          { label: 'Suspended', value: counts.suspended, icon: <UserX className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 truncate">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <AdminSearch value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name, email, phone…" className="flex-1 min-w-[200px] max-w-xs" />
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${roleFilter === r ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === s ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <AdminTable<AdminUser>
        columns={columns} data={filtered} keyFn={u => u.id}
        loading={loading} emptyText="No users found" emptyIcon={<Users />}
        page={page} totalPages={meta?.totalPages} total={meta?.total} onPage={p => setPage(p)}
      />

      {/* Create */}
      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={createForm.name} onChange={v => setCreateForm(f => ({ ...f, name: v }))} required />
            <Input label="Email" type="email" value={createForm.email} onChange={v => setCreateForm(f => ({ ...f, email: v }))} required />
            <Input label="Password" type="password" value={createForm.password} onChange={v => setCreateForm(f => ({ ...f, password: v }))} required placeholder="Min. 8 characters" />
            <Input label="Phone" value={createForm.phone} onChange={v => setCreateForm(f => ({ ...f, phone: v }))} placeholder="+250 7XX XXX XXX" />
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400">
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Create User
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit */}
      <AdminModal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit: ${editUser?.name}`}>
        {/* ── Basic Information ── */}
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Basic Information</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Full Name" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} required />
            <Input label="Email" type="email" value={editForm.email} onChange={v => setEditForm(f => ({ ...f, email: v }))} required />
            <Input label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} placeholder="+250 7XX XXX XXX" />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400">
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {/* Active / Suspended toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Status</p>
              <p className="text-xs text-slate-400">{editForm.isActive ? 'User can log in and use the platform' : 'User is suspended and cannot log in'}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                editForm.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                editForm.isActive ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Save Changes
            </button>
            <button type="button" onClick={() => setEditUser(null)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
          </div>
        </form>

        {/* ── Reset Password Section ── */}
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reset Password</p>
          {resetPwdSuccess && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              Password reset successfully!
            </div>
          )}
          {resetPwdError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">{resetPwdError}</div>
          )}
          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">New Password *</label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={resetPwdForm.newPassword}
                onChange={e => setResetPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 pr-10 text-sm outline-none focus:border-orange-400"
              />
              <button type="button" onClick={() => setShowNewPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {resetPwdForm.newPassword.length > 0 && (() => {
              const s = pwdStrength(resetPwdForm.newPassword);
              return (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${s.color}`} style={{ width: s.width }} />
                  </div>
                  <p className={`text-xs font-medium ${
                    s.label === 'Weak' ? 'text-red-500' :
                    s.label === 'Fair' ? 'text-yellow-500' :
                    s.label === 'Good' ? 'text-blue-500' : 'text-green-500'
                  }`}>{s.label}</p>
                </div>
              );
            })()}
          </div>
          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                value={resetPwdForm.confirmPassword}
                onChange={e => setResetPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
                className={`w-full rounded-xl border ${
                  resetPwdForm.confirmPassword && resetPwdForm.confirmPassword !== resetPwdForm.newPassword
                    ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                } bg-white dark:bg-slate-800 dark:text-white px-3 py-2 pr-10 text-sm outline-none focus:border-orange-400`}
              />
              <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetPwdForm.confirmPassword && resetPwdForm.confirmPassword !== resetPwdForm.newPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <button
            type="button"
            disabled={resetPwdSaving || resetPwdForm.newPassword.length < 8 || resetPwdForm.newPassword !== resetPwdForm.confirmPassword}
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition"
          >
            {resetPwdSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            <KeyRound className="h-4 w-4" /> Reset Password
          </button>
        </div>
      </AdminModal>

      {/* Confirm reset password dialog */}
      <ConfirmModal
        open={confirmResetOpen}
        danger
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetUserPassword}
        loading={resetPwdSaving}
        title="Reset User Password"
        message={`This will immediately replace the password for "${editUser?.name}". They will need to use the new password to log in. Continue?`}
        confirmLabel="Yes, Reset Password"
      />

      {/* Change Password (own account) */}
      <AdminModal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change My Password">
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          This changes <strong>your own</strong> admin account password.
        </div>
        {pwdSuccess && <div className="mb-3 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">Password changed successfully!</div>}
        {pwdError && <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">{pwdError}</div>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={pwdForm.currentPassword} onChange={v => setPwdForm(f => ({ ...f, currentPassword: v }))} required />
          <Input label="New Password" type="password" value={pwdForm.newPassword} onChange={v => setPwdForm(f => ({ ...f, newPassword: v }))} required placeholder="Min. 8 characters" />
          <Input label="Confirm New Password" type="password" value={pwdForm.confirmPassword} onChange={v => setPwdForm(f => ({ ...f, confirmPassword: v }))} required />
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Change Password
            </button>
            <button type="button" onClick={() => setPwdOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        open={!!confirm}
        danger={confirm?.action === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={handleToggle}
        loading={saving}
        title={confirm?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={`${confirm?.action === 'suspend' ? 'Suspend' : 'Activate'} "${confirm?.user.name}"?`}
        confirmLabel={confirm?.action === 'suspend' ? 'Suspend' : 'Activate'}
      />
    </div>
  );
};

export default AdminUsersPage;
