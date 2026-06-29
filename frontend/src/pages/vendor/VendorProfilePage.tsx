import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Save, X, Store, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorProfileService, type NcoleVendorProfile } from '@/services/api';
import { PCard, PButton, PInput, PTextarea, Spinner } from '@/components/ui/portal-ui';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  businessName: z.string().min(2),
  description: z.string().optional(),
  momoNumber: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const VendorProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<NcoleVendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    vendorProfileService.getMyProfile()
      .then(res => {
        setProfile(res.data);
        reset({ businessName: res.data.businessName, description: res.data.description ?? '', momoNumber: res.data.momoNumber ?? '' });
      })
      .catch(() => setError('Could not load vendor profile.'))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: Form) => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await vendorProfileService.updateProfile(profile.id, data);
      setProfile(res.data);
      setEditing(false);
    } catch { setError('Failed to save changes.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Store Profile</h1>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</p>}

      <PCard>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-2xl font-bold text-violet-700 dark:text-violet-300">
            <Store className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold dark:text-white truncate">{profile?.businessName ?? user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">Vendor since {user ? formatDate(user.createdAt) : '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile?.isVerified
              ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="h-4 w-4" />Verified</span>
              : <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium"><XCircle className="h-4 w-4" />Pending</span>}
            <button onClick={() => setEditing(e => !e)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
              {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PInput label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
            <PTextarea label="Description" {...register('description')} rows={3} placeholder="Describe your store…" />
            <PInput label="MoMo Number" {...register('momoNumber')} placeholder="+250 7XX XXX XXX" />
            <div className="flex gap-3">
              <PButton type="submit" size="sm" loading={saving}><Save className="h-4 w-4" />Save Changes</PButton>
              <PButton type="button" variant="secondary" size="sm" onClick={() => { setEditing(false); reset(); }}>Cancel</PButton>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            {[
              ['Business Name', profile?.businessName ?? '—'],
              ['Description', profile?.description ?? 'Not set'],
              ['MoMo Number', profile?.momoNumber ?? 'Not set'],
              ['Email', user?.email ?? '—'],
              ['Phone', user?.phone ?? 'Not set'],
              ['Status', profile?.isActive ? 'Active' : 'Inactive'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b pb-2 last:border-0 dark:border-slate-700">
                <span className="text-slate-500">{l}</span>
                <span className="font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        )}
      </PCard>
    </div>
  );
};

export default VendorProfilePage;
