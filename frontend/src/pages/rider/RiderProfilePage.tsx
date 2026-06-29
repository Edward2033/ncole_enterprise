import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService } from '@/services/api';
import { PCard, PButton, PInput, Spinner } from '@/components/ui/portal-ui';
import { formatDate } from '@/lib/utils';

const schema = z.object({ name: z.string().min(2), phone: z.string().optional() });
type Form = z.infer<typeof schema>;

const RiderProfilePage: React.FC = () => {
  const { user, refreshUser, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  const onSubmit = async (data: Form) => {
    setSaving(true); setError(null);
    try {
      await usersService.updateMe(data);
      await refreshUser();
      setEditing(false);
    } catch { setError('Failed to save changes.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-white">Profile</h1>
      <PCard>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-2xl font-bold text-orange-700 dark:text-orange-300">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="mt-0.5 text-xs text-green-600 font-medium">● Rider</p>
          </div>
          <button onClick={() => { setEditing(e => !e); if (!editing) reset({ name: user?.name ?? '', phone: user?.phone ?? '' }); }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0">
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</p>}

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
            {([['Email', user?.email], ['Phone', user?.phone ?? 'Not set'], ['Role', user?.role], ['Member since', user ? formatDate(user.createdAt) : '—']] as [string, string | undefined][])
              .map(([l, v]) => (
                <div key={l} className="flex justify-between border-b pb-2 last:border-0 dark:border-slate-700">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-medium dark:text-white">{v}</span>
                </div>
              ))}
          </div>
        )}
      </PCard>
    </div>
  );
};

export default RiderProfilePage;
