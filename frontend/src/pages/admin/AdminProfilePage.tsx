import React, { useRef, useState } from 'react';
import { Camera, Save, X, Edit2, Check, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminUsersApi } from '@/services/adminApi';
import { API_BASE } from '@/config/api';

const AdminProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/products/upload-application-photo`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      const url: string = json.data.url;
      await adminUsersApi.updateMe({ avatarUrl: url });
      await refreshUser();
      flash('Avatar updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      await adminUsersApi.updateMe({ name: name.trim(), phone: phone.trim() || undefined });
      await refreshUser();
      setEditing(false);
      flash('Profile updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    setPwSaving(true); setPwError('');
    try {
      await adminUsersApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwOpen(false); setCurrentPw(''); setNewPw('');
      flash('Password changed successfully.');
    } catch (err) {
      setPwError((err as Error).message);
    } finally { setPwSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'A';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your administrator account</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Avatar + profile card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-orange-100 dark:ring-orange-900/30" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-2xl font-bold ring-4 ring-orange-50 dark:ring-orange-900/20">
                {initials}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change avatar"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-800 hover:bg-orange-600 transition disabled:opacity-50"
            >
              {uploading
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Camera className="h-3.5 w-3.5 text-white" />}
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
              {user?.role}
            </span>
          </div>
          <button
            onClick={() => { setEditing(e => !e); setError(''); setName(user?.name ?? ''); setPhone(user?.phone ?? ''); }}
            className="ml-auto rounded-xl border border-slate-200 dark:border-slate-600 p-2 text-slate-500 hover:border-orange-300 hover:text-orange-600 transition"
          >
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="mt-5 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+250 7XX XXX XXX"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition active:scale-95">
                {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 grid gap-2 text-sm border-t border-slate-100 dark:border-slate-700 pt-5">
            {[
              { label: 'Email', value: user?.email ?? '—' },
              { label: 'Phone', value: user?.phone ?? 'Not set' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'long' }) : '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Change Password</p>
              <p className="text-xs text-slate-500">Update your admin account password</p>
            </div>
          </div>
          <button onClick={() => { setPwOpen(o => !o); setPwError(''); setCurrentPw(''); setNewPw(''); }}
            className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            {pwOpen ? 'Cancel' : 'Change'}
          </button>
        </div>
        {pwOpen && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
            {pwError && <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">{pwError}</p>}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">New Password (min 8 chars)</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition" />
            </div>
            <button type="submit" disabled={pwSaving}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition active:scale-95">
              {pwSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {pwSaving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminProfilePage;
