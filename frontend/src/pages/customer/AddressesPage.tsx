import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Star, MapPin } from 'lucide-react';
import { addressesService, type NcoleAddress } from '@/services/api';
import { PButton, PInput, PCard, Spinner, PEmptyState } from '@/components/ui/portal-ui';

const addrSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(9),
  street: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  country: z.string().default('Rwanda'),
  isDefault: z.boolean().default(false),
});
type AddressForm = z.infer<typeof addrSchema>;

const AddressesPage: React.FC = () => {
  const [items, setItems] = useState<NcoleAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NcoleAddress | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AddressForm>({
    resolver: zodResolver(addrSchema),
    defaultValues: { country: 'Rwanda', isDefault: false },
  });

  const load = () => {
    addressesService.list().then(res => setItems(res.data)).catch(() => null).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (addr: NcoleAddress) => {
    setEditing(addr);
    setShowForm(true);
    setValue('label', addr.label ?? '');
    setValue('fullName', addr.fullName);
    setValue('phone', addr.phone);
    setValue('street', addr.street);
    setValue('district', addr.district);
    setValue('city', addr.city);
    setValue('province', addr.province);
    setValue('country', addr.country);
    setValue('isDefault', addr.isDefault);
  };

  const onSubmit = async (data: AddressForm) => {
    if (editing) await addressesService.update(editing.id, data);
    else await addressesService.create(data);
    reset(); setShowForm(false); setEditing(null); load();
  };

  const handleDelete = async (id: string) => {
    await addressesService.remove(id).catch(() => null);
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Addresses</h1>
        {!showForm && (
          <PButton size="sm" onClick={() => { setEditing(null); reset(); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Add Address
          </PButton>
        )}
      </div>

      {showForm && (
        <PCard>
          <h2 className="mb-4 font-semibold">{editing ? 'Edit Address' : 'New Address'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PInput label="Label (e.g. Home)" {...register('label')} className="sm:col-span-2" />
            <PInput label="Full Name" {...register('fullName')} error={errors.fullName?.message} className="sm:col-span-2" />
            <PInput label="Phone" {...register('phone')} error={errors.phone?.message} />
            <PInput label="Street" {...register('street')} error={errors.street?.message} />
            <PInput label="District" {...register('district')} error={errors.district?.message} />
            <PInput label="City" {...register('city')} error={errors.city?.message} />
            <PInput label="Province" {...register('province')} error={errors.province?.message} />
            <PInput label="Country" {...register('country')} />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register('isDefault')} className="rounded" />
              Set as default address
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <PButton type="submit" size="sm" loading={isSubmitting}>Save Address</PButton>
              <PButton type="button" variant="secondary" size="sm" onClick={() => { setShowForm(false); setEditing(null); reset(); }}>Cancel</PButton>
            </div>
          </form>
        </PCard>
      )}

      {loading ? (
        <div className="flex justify-center pt-8"><Spinner /></div>
      ) : items.length === 0 && !showForm ? (
        <PEmptyState icon={<MapPin className="h-8 w-8 text-slate-400" />} title="No addresses yet"
          description="Add a delivery address to speed up checkout." />
      ) : (
        <div className="space-y-3">
          {items.map(addr => (
            <PCard key={addr.id} className="relative">
              {addr.isDefault && (
                <span className="absolute right-4 top-4 flex items-center gap-1 text-xs font-semibold text-orange-600">
                  <Star className="h-3 w-3" /> Default
                </span>
              )}
              <p className="font-semibold text-slate-900 dark:text-white">{addr.fullName}</p>
              {addr.label && <p className="text-xs text-slate-400">{addr.label}</p>}
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {addr.street}, {addr.district}, {addr.city}, {addr.province}, {addr.country}
              </p>
              <p className="text-sm text-slate-500">{addr.phone}</p>
              <div className="mt-3 flex gap-2">
                <PButton size="sm" variant="secondary" onClick={() => openEdit(addr)}>
                  <Edit2 className="h-3 w-3" /> Edit
                </PButton>
                <PButton size="sm" variant="danger" onClick={() => handleDelete(addr.id)}>
                  <Trash2 className="h-3 w-3" /> Delete
                </PButton>
              </div>
            </PCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
