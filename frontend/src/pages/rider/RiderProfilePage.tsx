import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Edit2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService, riderService, type NcoleRiderProfile } from '@/services/api';
import { PCard, PButton, PInput, Spinner } from '@/components/ui/portal-ui';
import { formatDate } from '@/lib/utils';

const schema = z.object({ name: z.string().min(2), phone: z.string().optional() });
type Form = z.infer<typeof schema>;

const STATUS_LABEL: Record<NcoleRiderProfile['status'], string> = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
};
const STATUS_COLOR: Record<NcoleRiderProfile['status'], string> = {
  AVAILABLE: 'text-green-600',
  BUSY: 'text-amber-600',
  OFFLINE: 'text-slate-400',
};

const RiderProfilePage: React.FC = () => {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [riderProfile, setRiderProfile] = useState<NcoleRiderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await usersService.uploadAvatar(file);
      await usersService.updateMe({ avatarUrl: url });
      await refreshUser();
    } catch { /* silent */ }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  // R3: fetch rider-specific profile (vehicle type, plate, status, verification)
  useEffect(() => {
    riderService.getMyProfile()
      .then(res => setRiderProfile(res.data))
      .catch(e => setProfileError((e as Error).message || 'Could not load rider profile.'))
      .finally(() => setProfileLoading(false));
  }, []);

  const onSubmit = async (data: Form) => {
    setSaving(true); setSaveError(null);
    try {
      await usersService.updateMe(data);
      await refreshUser();
      setEditing(false);
    } catch { setSaveError('Failed to save changes.'); }
    finally { setSaving(false); }
  };

  const loading = authLoading || profileLoading;
  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-white">Profile</h1>

      {/* R5: show profile error non-fatally — user info still renders from auth context */}
      {profileError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {profileError}
        </div>
      )}

      {/* ── Personal info card ──────────────────────────────────────────────── */}
      <PCard>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-2xl font-bold text-orange-700 dark:text-orange-300">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-800 hover:bg-orange-600 transition disabled:opacity-50">
              {uploading
                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Camera className="h-3 w-3 text-white" />}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="mt-0.5 text-xs text-orange-600 font-medium">● Rider</p>
          </div>
          <button
            onClick={() => { setEditing(e => !e); if (!editing) reset({ name: user?.name ?? '', phone: user?.phone ?? '' }); }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
          >
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </button>
        </div>

        {saveError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{saveError}</p>}

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PInput label="Full Name" {...register('name')} error={errors.name?.message} />
            <PInput label="Phone" type="tel" placeholder="+250 7XX XXX XXX" {...register('phone')} />
            <div className="flex gap-3">
              <PButton type="submit" size="sm" loading={saving}><Save className="h-4 w-4" />Save</PButton>
              <PButton type="button" variant="secondary" size="sm" onClick={() => { setEditing(false); reset(); }}>Cancel</PButton>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            {([
              ['Email',        user?.email],
              ['Phone',        user?.phone ?? 'Not set'],
              ['Member since', user ? formatDate(user.createdAt) : '—'],
            ] as [string, string | undefined][]).map(([l, v]) => (
              <div key={l} className="flex justify-between border-b pb-2 last:border-0 dark:border-slate-700">
                <span className="text-slate-500">{l}</span>
                <span className="font-medium dark:text-white">{v}</span>
              </div>
            ))}
          </div>
        )}
      </PCard>

      {/* R2+R3: rider-specific info — vehicle, status, verification */}
      {riderProfile && (
        <PCard>
          <h2 className="mb-4 font-semibold dark:text-white">Rider Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2 dark:border-slate-700">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${STATUS_COLOR[riderProfile.status]}`}>
                ● {STATUS_LABEL[riderProfile.status]}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-slate-700">
              <span className="text-slate-500">Verification</span>
              {riderProfile.isVerified ? (
                <span className="flex items-center gap-1 font-medium text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-amber-600">
                  <XCircle className="h-3.5 w-3.5" /> Pending verification
                </span>
              )}
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-slate-700">
              <span className="text-slate-500">Vehicle type</span>
              <span className="font-medium dark:text-white">{riderProfile.vehicleType ?? 'Not set'}</span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-slate-700">
              <span className="text-slate-500">Plate number</span>
              <span className="font-medium font-mono dark:text-white">{riderProfile.plateNumber ?? 'Not set'}</span>
            </div>
            <div className="flex justify-between dark:border-slate-700">
              <span className="text-slate-500">Rider since</span>
              <span className="font-medium dark:text-white">{formatDate(riderProfile.createdAt)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Vehicle details and verification status can only be updated by an administrator.</p>
        </PCard>
      )}
    </div>
  );
};

export default RiderProfilePage;
